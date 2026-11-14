import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.farm import Farm
from app.models.digital_twin_snapshot import DigitalTwinSnapshot
from app.models.environmental_observation import EnvironmentalObservation
from app.services.soil_service import SoilService
from app.services.terrain_service import TerrainService
from app.services.nasa_power_service import NASAPowerService
from app.services.vegetation_service import VegetationService
from app.services.smap_service import SMAPService
from app.services.crop_service import CropService


class DigitalTwinService:
    @classmethod
    async def get_or_create_twin(cls, db: Session, farm: Farm) -> Dict[str, Any]:
        """
        Synthesizes the live multi-layer digital twin representation of the farm:
        Geography + Soil + Terrain + Earth Observations + Crop State + Risk Telemetry.
        """
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # 1. Gather all subsystem telemetry
        soil = SoilService.analyze_soil_profile(db, farm.id)
        terrain = TerrainService.get_or_calculate_terrain(db, farm.id, farm.latitude, farm.longitude)
        weather = await NASAPowerService.fetch_and_store_weather(
            db, farm.id, farm.latitude, farm.longitude, days_back=30
        )
        veg = VegetationService.get_or_generate_vegetation_indices(
            db, farm.id, farm.latitude, farm.longitude
        )
        smap = SMAPService.get_regional_soil_moisture(farm.latitude, farm.longitude)

        latest_weather = weather[-1] if weather else {}
        latest_veg = veg[-1] if veg else {"ndvi": 0.74, "ndmi": 0.28}

        rainfall_30d = sum(w.get("rainfall_mm", 0.0) for w in weather)
        avg_temp = sum(w["temp_mean"] for w in weather) / max(len(weather), 1) if weather else 27.2

        # 2. Multi-Factor Environmental Risk Assessment
        risk_score = 15.0  # Baseline low risk
        risk_factors = []

        # Risk A: Heavy Rainfall / Drainage Swale
        heavy_rain_count = sum(1 for w in weather if w.get("rainfall_mm", 0.0) >= 40.0)
        if heavy_rain_count >= 2 and "swale" in terrain["flow_accumulation_risk"].lower():
            risk_score += 25.0
            risk_factors.append({
                "factor": "Topographic Drainage Swale Saturation",
                "severity": "Moderate-High",
                "detail": f"{heavy_rain_count} heavy rainfall days detected in last 30d along natural gathering swale.",
            })

        # Risk B: Soil Acidity / Missing Lab Data
        if soil["effective_ph"] < 5.5:
            risk_score += 15.0
            risk_factors.append({
                "factor": "Soil Acidity Limitation",
                "severity": "Moderate",
                "detail": f"Soil pH {soil['effective_ph']} is strongly acidic. Micronutrient lockup possible without liming.",
            })
        if not soil["has_lab_test"]:
            risk_factors.append({
                "factor": "Unverified Soil NPK Baseline",
                "severity": "Informational",
                "detail": "Physical laboratory test missing. SoilGrids modelled estimates active.",
            })

        # Risk C: Water Stress vs Crop Demand
        if rainfall_30d < 60.0 and not farm.irrigation_available and "banana" in (farm.current_crop or "").lower():
            risk_score += 30.0
            risk_factors.append({
                "factor": "High Foliar Moisture Deficit",
                "severity": "High",
                "detail": "Banana crop under rainfed conditions experiencing sub-optimal 30-day precipitation.",
            })

        risk_score = min(max(round(risk_score, 1), 5.0), 95.0)
        if risk_score >= 60:
            risk_level = "Elevated"
        elif risk_score >= 35:
            risk_level = "Moderate"
        else:
            risk_level = "Low / Stable"

        completeness = 92.0 if soil["has_lab_test"] else 68.0

        # Snapshot structure
        twin_data = {
            "farm_id": farm.id,
            "farm_name": farm.farm_name,
            "location": farm.location_name,
            "coordinates": {"lat": farm.latitude, "lon": farm.longitude},
            "area": {
                "hectares": farm.total_area_hectares,
                "acres": farm.total_area_acres,
                "boundary_type": "WGS84 Polygon",
            },
            "crop_state": {
                "current_crop": farm.current_crop or "Robusta Banana",
                "planting_date": farm.planting_date or "2026-06-15",
                "expected_harvest_date": farm.expected_harvest_date or "2027-04-20",
                "irrigation_active": farm.irrigation_available,
                "farming_priority": farm.farming_priorities,
            },
            "soil_state": soil,
            "terrain_state": terrain,
            "environmental_state": {
                "cumulative_rainfall_30d_mm": round(rainfall_30d, 1),
                "avg_temperature_c": round(avg_temp, 1),
                "smap_moisture_m3m3": smap["surface_soil_moisture_m3m3"],
                "smap_regional_status": smap["regional_status"],
            },
            "vegetation_state": {
                "latest_ndvi": latest_veg.get("ndvi", 0.74),
                "latest_ndmi": latest_veg.get("ndmi", 0.28),
                "canopy_status": VegetationService.evaluate_canopy_status(
                    latest_veg.get("ndvi", 0.74), latest_veg.get("ndmi", 0.28)
                )["interpretation"],
            },
            "risk_assessment": {
                "overall_risk_score": risk_score,
                "risk_level": risk_level,
                "risk_factors": risk_factors,
            },
            "data_completeness_pct": completeness,
            "last_synced": today_str,
        }

        # Save snapshot
        snapshot = DigitalTwinSnapshot(
            farm_id=farm.id,
            snapshot_date=today_str,
            environmental_state_raw=json.dumps(twin_data["environmental_state"]),
            soil_state_raw=json.dumps(twin_data["soil_state"]),
            vegetation_state_raw=json.dumps(twin_data["vegetation_state"]),
            crop_state_raw=json.dumps(twin_data["crop_state"]),
            terrain_state_raw=json.dumps(twin_data["terrain_state"]),
            overall_risk_score=risk_score,
            risk_level=risk_level,
            risk_factors_raw=json.dumps(risk_factors),
            data_completeness_pct=completeness,
        )
        db.add(snapshot)
        db.commit()

        return twin_data

    @classmethod
    def simulate_scenario(
        cls,
        db: Session,
        farm: Farm,
        crop_name: str,
        rainfall_delta_pct: float = 0.0,
        irrigation_available: Optional[bool] = None,
        planting_delay_days: int = 0,
    ) -> Dict[str, Any]:
        """
        Interactive What-If Simulation Engine:
        Simulates hypothetical farm conditions:
        - Crop substitution (e.g. Tapioca vs Banana)
        - Climate shock (-35% drought or +40% heavy monsoon)
        - Irrigation failure / cutback
        - Delayed sowing
        """
        crops = CropService.list_crops(db)
        c_lower = crop_name.lower().strip()
        matched_crop = next(
            (c for c in crops if c.crop_name.lower() == c_lower or c_lower in c.crop_name.lower() or c.crop_name.lower() in c_lower or c.id.lower() == c_lower),
            crops[0]
        )

        soil = SoilService.analyze_soil_profile(db, farm.id)
        terrain = TerrainService.get_or_calculate_terrain(db, farm.id, farm.latitude, farm.longitude)

        # Baseline rainfall from observations or default
        recent_rain_obs = (
            db.query(EnvironmentalObservation)
            .filter(EnvironmentalObservation.farm_id == farm.id, EnvironmentalObservation.parameter == "rainfall")
            .all()
        )
        base_rain = round(sum(o.value for o in recent_rain_obs[-30:]), 1) if recent_rain_obs else 180.0
        simulated_rain = round(base_rain * (1.0 + (rainfall_delta_pct / 100.0)), 1)
        sim_irrigation = farm.irrigation_available if irrigation_available is None else irrigation_available

        # Recalculate suitability under scenario
        suit = CropService.calculate_suitability(
            crop=matched_crop,
            ph=soil["effective_ph"],
            texture=soil["effective_texture"],
            avg_temp=27.5,
            rainfall_30d=simulated_rain,
            irrigation_available=sim_irrigation,
            slope_deg=terrain["slope_mean_deg"],
            flow_risk=terrain["flow_accumulation_risk"],
            has_lab_test=soil["has_lab_test"],
        )

        # Calculate scenario risks dynamically based on perturbations
        sim_risk_score = 15.0
        consequences = []

        # Drought impact scaling
        if rainfall_delta_pct < 0:
            deficit = abs(rainfall_delta_pct)
            if not sim_irrigation:
                if matched_crop.water_demand_category == "High":
                    sim_risk_score += deficit * 1.1 + 15.0
                    consequences.append(
                        f"Severe moisture deficit: {matched_crop.crop_name} is a high water-demand crop under rainfed conditions; "
                        f"projected seasonal yield loss of {min(85, int(deficit * 1.4))}%."
                    )
                elif matched_crop.water_demand_category == "Moderate":
                    sim_risk_score += deficit * 0.8 + 10.0
                    consequences.append(
                        f"Moderate drought stress: {matched_crop.crop_name} requires supplemental irrigation during the dry spell."
                    )
                else:  # Low water demand (Cassava, Pulses)
                    sim_risk_score += deficit * 0.35 + 5.0
                    consequences.append(
                        f"Hardy drought resilience: {matched_crop.crop_name} tolerates dry spells with minimal physiological stress."
                    )
            else:
                sim_risk_score += deficit * 0.35
                consequences.append(
                    f"Active drip irrigation buffers rainfall deficit ({rainfall_delta_pct:+.0f}%); operational pumping power and water extraction costs increase."
                )

        # Flood / heavy rain impact scaling
        if rainfall_delta_pct > 20.0:
            excess = rainfall_delta_pct
            if "flooded" in matched_crop.drainage_preference.lower():
                consequences.append(
                    f"Excess monsoon precipitation ({rainfall_delta_pct:+.0f}%) is highly favorable for flooded basin crops like Paddy."
                )
            elif "swale" in terrain.get("flow_accumulation_risk", "").lower() or matched_crop.drainage_preference.startswith("Well"):
                sim_risk_score += excess * 0.75 + 10.0
                consequences.append(
                    f"Waterlogging vulnerability: Terrain swales risk root/rhizome rot under {rainfall_delta_pct:+.0f}% rainfall excess."
                )
            else:
                sim_risk_score += excess * 0.4
                consequences.append(
                    f"Heavy rainfall ({rainfall_delta_pct:+.0f}%) accelerates topsoil nutrient leaching; requires contour channel inspection."
                )

        if planting_delay_days > 10:
            sim_risk_score += min(25.0, planting_delay_days * 0.6)
            consequences.append(
                f"Delayed sowing (+{planting_delay_days} days) shifts maturation into seasonal dry window."
            )

        sim_risk_score = min(max(round(sim_risk_score, 1), 5.0), 95.0)

        # Multi-Strategy Simulation: Evaluate how Strategy A, B, and C hold up under this exact shock
        if rainfall_delta_pct < -15.0:
            # Drought scenario
            strat_a_resilience = round(max(60.0, 93.5 - (abs(rainfall_delta_pct) * 0.22)), 1)
            strat_b_resilience = round(max(70.0, 89.0 - (abs(rainfall_delta_pct) * 0.08) + 5.0), 1)  # Designed for drought
            strat_c_resilience = round(max(50.0, 91.0 - (abs(rainfall_delta_pct) * 0.38)), 1)  # Banana sensitive
            best_strat = "water_efficiency"
        elif rainfall_delta_pct > 20.0:
            # Flood / Excess rain scenario
            strat_a_resilience = round(max(55.0, 93.5 - (rainfall_delta_pct * 0.28)), 1)  # Cassava sensitive to waterlogging
            strat_b_resilience = round(max(60.0, 89.0 - (rainfall_delta_pct * 0.20)), 1)
            strat_c_resilience = round(max(50.0, 91.0 - (rainfall_delta_pct * 0.32)), 1)  # Ginger rot risk
            best_strat = "water_efficiency"
        else:
            # Near-normal baseline
            strat_a_resilience = 93.5
            strat_b_resilience = 89.0
            strat_c_resilience = 91.0
            best_strat = "soil_health"

        strategy_evaluations = [
            {
                "strategy_id": "strat-soil-health",
                "strategy": "soil_health",
                "strategy_name": "Strategy A: Soil Health Priority",
                "crops": "Banana → Cowpea → Cassava",
                "resilience_score": strat_a_resilience,
                "resilience_rating": "High Resilience" if strat_a_resilience >= 85 else ("Moderate Resilience" if strat_a_resilience >= 70 else "Vulnerable"),
                "impact_summary": (
                    f"Under {rainfall_delta_pct:+.0f}% rain: Year 2 Cowpea deep taproot tolerates dry spell. "
                    "Accumulated soil organic carbon (+18%) retains subsoil moisture."
                ),
                "is_recommended": best_strat == "soil_health",
            },
            {
                "strategy_id": "strat-water-efficiency",
                "strategy": "water_efficiency",
                "strategy_name": "Strategy B: Water Efficiency Priority",
                "crops": "Maize → Black Gram → Turmeric",
                "resilience_score": strat_b_resilience,
                "resilience_rating": "Highest Resilience" if strat_b_resilience >= 85 else "Moderate Resilience",
                "impact_summary": (
                    f"Under {rainfall_delta_pct:+.0f}% rain: Optimal water defense. Saves ~38% irrigation water "
                    "relative to perennial crops; zero irrigation needed during pulse stage."
                ),
                "is_recommended": best_strat == "water_efficiency",
            },
            {
                "strategy_id": "strat-balanced",
                "strategy": "balanced",
                "strategy_name": "Strategy C: Balanced Strategy",
                "crops": "Banana → Vegetable Cowpea → Ginger",
                "resilience_score": strat_c_resilience,
                "resilience_rating": "Moderate Resilience" if strat_c_resilience >= 75 else "Vulnerable Without Irrigation",
                "impact_summary": (
                    f"Under {rainfall_delta_pct:+.0f}% rain: Year 1 commercial banana requires supplemental irrigation; "
                    "Year 2 cowpea recovers soil vitality."
                ),
                "is_recommended": best_strat == "balanced",
            },
        ]

        return {
            "simulation_id": f"SIM-{int(datetime.now().timestamp())}",
            "farm_id": farm.id,
            "farm_name": farm.farm_name,
            "scenario_inputs": {
                "simulated_crop": matched_crop.crop_name,
                "rainfall_variation_pct": f"{rainfall_delta_pct:+.1f}%",
                "simulated_30d_rain_mm": simulated_rain,
                "irrigation_active": sim_irrigation,
                "planting_delay_days": planting_delay_days,
            },
            "recalculated_suitability": {
                "crop": matched_crop.crop_name,
                "score": suit["suitability_score"],
                "class": suit["suitability_class"],
                "supporting_factors": suit["supporting_factors"],
                "limitations": suit["limitations"],
            },
            "projected_risk_score": sim_risk_score,
            "projected_risk_level": "Elevated" if sim_risk_score >= 60 else "Moderate" if sim_risk_score >= 35 else "Low",
            "consequences": consequences or ["Favorable scenario with minimal environmental disruption."],
            "strategy_evaluations": strategy_evaluations,
            "scientific_disclaimer": (
                "What-if simulation is a predictive decision-support indicator based on multi-factor agronomic rules. "
                "It connects farm crop choice with multi-year rotation resilience under climate shocks."
            ),
        }
