import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.farm import Farm
from app.models.digital_twin_snapshot import DigitalTwinSnapshot
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
        matched_crop = next((c for c in crops if c.crop_name.lower() == crop_name.lower()), crops[0])

        soil = SoilService.analyze_soil_profile(db, farm.id)
        terrain = TerrainService.get_or_calculate_terrain(db, farm.id, farm.latitude, farm.longitude)

        # Baseline rainfall modified by delta
        base_rain = 180.0
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

        # Calculate scenario risks
        sim_risk_score = 15.0
        consequences = []

        if rainfall_delta_pct < -25.0:
            if not sim_irrigation and matched_crop.water_demand_category in ["High", "Moderate"]:
                sim_risk_score += 35.0
                consequences.append(f"Severe moisture stress: {matched_crop.crop_name} requires irrigation during rainfall deficit.")
            else:
                consequences.append("Irrigation buffers precipitation deficit; operational pumping costs will increase.")

        if rainfall_delta_pct > 30.0:
            if "swale" in terrain["flow_accumulation_risk"].lower() and matched_crop.drainage_preference.startswith("Well"):
                sim_risk_score += 28.0
                consequences.append(f"Waterlogging vulnerability: Southern swale risks rhizome/root rot under +{rainfall_delta_pct}% rainfall.")
            elif "flooded" in matched_crop.drainage_preference.lower():
                consequences.append("Excess rainfall is favorable for flooded basin crops like Paddy.")

        if planting_delay_days > 25:
            sim_risk_score += 12.0
            consequences.append(f"Delayed sowing (+{planting_delay_days} days) shifts maturation into seasonal dry window.")

        sim_risk_score = min(max(round(sim_risk_score, 1), 5.0), 95.0)

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
            "scientific_disclaimer": (
                "What-if simulation is a predictive decision-support indicator based on multi-factor agronomic rules. "
                "It does not constitute an exact physiological yield guarantee."
            ),
        }
