import re
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.models.farm import Farm
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.services.digital_twin_service import DigitalTwinService
from app.services.soil_service import SoilService
from app.services.crop_service import CropService
from app.services.rotation_optimizer import RotationOptimizer
from app.services.nasa_power_service import NASAPowerService
from app.services.vegetation_service import VegetationService


class AIAssistantService:
    """
    FieldShift AI Agricultural Decision-Support Assistant.
    Provider-independent engine featuring:
    - Zero paid API dependencies (runs locally and deterministically).
    - Deep telemetry tool-calling pattern across farm twin, soil, weather, terrain, and rotation.
    - Scientific grounding in Kerala Agricultural University (KAU) Package of Practices & ICAR guidelines.
    """

    @classmethod
    async def process_query(
        cls,
        db: Session,
        farm_id: str,
        user_id: str,
        user_message: str,
        session_id: str = None,
    ) -> Dict[str, Any]:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise ValueError(f"Farm with ID {farm_id} not found.")

        # 1. Resolve or create chat session
        if not session_id:
            session = ChatSession(
                farm_id=farm.id,
                user_id=user_id,
                title=user_message[:40] + ("..." if len(user_message) > 40 else ""),
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            session_id = session.id
        else:
            session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if not session:
                session = ChatSession(farm_id=farm.id, user_id=user_id, title="Farm Session")
                db.add(session)
                db.commit()
                db.refresh(session)
                session_id = session.id

        # 2. Record User Message
        user_record = ChatMessage(
            session_id=session_id,
            sender="user",
            content=user_message,
        )
        db.add(user_record)
        db.commit()

        # 3. Telemetry Tool Dispatching based on query intent
        msg_lower = user_message.lower()
        tools_executed: List[Dict[str, str]] = []
        citations: List[str] = [
            "Kerala Agricultural University (KAU) Package of Practices: Crops 2024",
            "NASA Earth Science Data Systems (GPM IMERG, NASA POWER, SMAP)",
        ]

        # Always pull digital twin baseline context
        twin_data = await DigitalTwinService.get_or_create_twin(db, farm)
        tools_executed.append({
            "tool_name": "get_farm_digital_twin",
            "description": f"Retrieved digital twin state for {farm.farm_name}",
            "summary_result": f"Risk: {twin_data['risk_assessment']['overall_risk_score']}/100 ({twin_data['risk_assessment']['risk_level']}), Area: {twin_data['area']['hectares']} ha",
        })

        # Routing Intent
        reply, follow_ups = cls._generate_grounded_response(
            db=db,
            farm=farm,
            msg=msg_lower,
            twin=twin_data,
            tools_executed=tools_executed,
            citations=citations,
        )

        # 4. Record Assistant Message in DB
        assistant_record = ChatMessage(
            session_id=session_id,
            sender="assistant",
            content=reply,
            tools_called=tools_executed,
            citations=citations,
        )
        db.add(assistant_record)
        db.commit()
        db.refresh(assistant_record)

        return {
            "session_id": session_id,
            "message_id": assistant_record.id,
            "reply": reply,
            "tools_executed": tools_executed,
            "citations": citations,
            "suggested_follow_ups": follow_ups,
        }

    @classmethod
    def _generate_grounded_response(
        cls,
        db: Session,
        farm: Farm,
        msg: str,
        twin: Dict[str, Any],
        tools_executed: List[Dict[str, str]],
        citations: List[str],
    ) -> Tuple[str, List[str]]:
        soil = twin["soil_state"]
        terrain = twin["terrain_state"]
        env = twin["environmental_state"]
        veg = twin["vegetation_state"]
        crop_state = twin["crop_state"]
        risk = twin["risk_assessment"]

        # Intent 1: What-If Simulation
        if any(w in msg for w in ["simulate", "what if", "scenario", "drought", "delay", "failure", "fail"]):
            tools_executed.append({
                "tool_name": "simulate_farm_scenario",
                "description": "Evaluated climate and agronomic perturbation against the digital twin state",
                "summary_result": "Ran simulation with -35% rainfall perturbation and rainfed conditions",
            })

            # Run default what-if simulation for demonstration
            sim = DigitalTwinService.simulate_scenario(
                db=db,
                farm_id=farm.id,
                simulated_crop="Cassava / Tapioca",
                rainfall_delta_pct=-35.0,
                irrigation_active=False,
                planting_delay_days=14,
            )

            consequences_list = "\n".join([f"- {c}" for c in sim["consequences"]])
            advice = (
                f"### What-If Scenario Simulation Result for **{farm.farm_name}**\n\n"
                f"**Scenario Tested:**\n"
                f"- **Crop:** {sim['scenario_inputs']['simulated_crop']}\n"
                f"- **Rainfall Deficit:** {sim['scenario_inputs']['rainfall_variation_pct']}\n"
                f"- **Irrigation:** Rainfed (No supplemental watering)\n"
                f"- **Planting Delay:** {sim['scenario_inputs']['planting_delay_days']} days\n\n"
                f"#### Projected Impact:\n"
                f"- **Recalculated Suitability:** **{sim['recalculated_suitability']['score']:.1f}/100** ({sim['recalculated_suitability']['class']})\n"
                f"- **Composite Risk Score:** **{sim['projected_risk_score']:.1f}/100** ({sim['projected_risk_level']})\n\n"
                f"#### Predicted Consequences:\n"
                f"{consequences_list}\n\n"
                f"> ℹ️ *{sim['scientific_disclaimer']}*"
            )
            follow_ups = [
                "How do I buffer against this drought risk?",
                "What crop would perform better under drought?",
                "Can I simulate an extreme rainfall scenario?",
            ]
            return advice, follow_ups

        # Intent 2: Crop Rotation, Strategy, Sequence
        if any(w in msg for w in ["rotation", "sequence", "strategy", "rotate", "after", "preceding", "follow"]):
            tools_executed.append({
                "tool_name": "optimize_crop_rotation",
                "description": "Generated multi-year rotation trajectories using agronomic family constraints and soil replenishment rules",
                "summary_result": "Built 3 alternative plans: Soil Health, Water Efficiency, and Balanced",
            })
            citations.append("KAU Principles of Agronomy & Cropping Systems")

            rotation_plans = RotationOptimizer.generate_strategies_for_farm(db, farm)
            strat_summary = []
            for s in rotation_plans:
                first_2_steps = " ➔ ".join([f"{step['crop_name']} ({step['season']})" for step in s['steps'][:2]])
                strat_summary.append(
                    f"- **{s['strategy_name']}** (Score: **{s['overall_score']:.1f}**)\n"
                    f"  - Sequence: {first_2_steps} ➔ ...\n"
                    f"  - Primary Objective: {s.get('soil_benefit_summary', s.get('strategy_name'))}"
                )

            advice = (
                f"### Crop Rotation Strategy Plans for **{farm.farm_name}**\n\n"
                f"Your farm is currently growing **{crop_state['current_crop']}** ({farm.total_area_acres:.1f} acres, {farm.farming_priorities}).\n\n"
                f"Here are the 3 algorithmic rotation pathways optimized for your soil and climate:\n\n"
                + "\n\n".join(strat_summary) +
                f"\n\n#### Why Legume Integration Matters:\n"
                f"Rotating heavy feeders (like Banana or Rice) with nitrogen-fixing pulses (Cowpea or Green Gram) fixes 40–80 kg N/ha naturally, reduces synthetic urea dependence, and disrupts monophagous nematode life cycles."
            )
            follow_ups = [
                "Tell me more about the Soil Health strategy.",
                "How much nitrogen does Cowpea add to the soil?",
                "What happens if I delay planting by 3 weeks?",
            ]
            return advice, follow_ups

        # Intent 3: Crop Selection / Recommendations / Suitability
        if any(w in msg for w in ["crop", "plant", "grow", "recommend", "suitability", "variety", "what should i"]):
            tools_executed.append({
                "tool_name": "evaluate_crop_suitability",
                "description": "Computed multi-factor weighted crop suitability scores for Kerala agro-ecological zones",
                "summary_result": "Evaluated 12 regionally validated crops against current climate and terrain constraints",
            })
            crops_to_eval = CropService.list_crops(db)
            evaluations = []
            for c in crops_to_eval:
                res = CropService.calculate_suitability(
                    crop=c,
                    ph=soil["effective_ph"],
                    texture=soil["effective_texture"],
                    avg_temp=env["avg_temperature_c"],
                    rainfall_30d=env["cumulative_rainfall_30d_mm"],
                    irrigation_available=crop_state["irrigation_active"],
                    slope_deg=terrain["slope_mean_deg"],
                    flow_risk=terrain["flow_accumulation_risk"],
                    has_lab_test=soil["has_lab_test"],
                )
                evaluations.append(res)
            evaluations.sort(key=lambda x: x["suitability_score"], reverse=True)
            top_3 = evaluations[:3]

            crops_text = "\n".join([
                f"{i+1}. **{c['crop_name']}** (`{c['scientific_name']}`)\n"
                f"   - **Suitability Score:** **{c['suitability_score']:.1f}/100** ({c['suitability_class']})\n"
                f"   - **Growth Duration:** {c['duration_days']}\n"
                f"   - **Key Advantage:** {', '.join(c['supporting_factors'][:2]) if c['supporting_factors'] else 'Regional climate fit'}\n"
                f"   - **Planting Window:** {c['planting_window']}"
                for i, c in enumerate(top_3)
            ])

            advice = (
                f"### Crop Suitability Evaluation for **{farm.farm_name}**\n\n"
                f"Based on your current farm telemetry:\n"
                f"- **30-Day NASA Rainfall:** {env['cumulative_rainfall_30d_mm']:.1f} mm\n"
                f"- **Mean Ambient Temperature:** {env['avg_temperature_c']:.1f} °C\n"
                f"- **Mean Slope:** {terrain['slope_mean_deg']:.1f}° ({terrain['slope_class']})\n"
                f"- **Soil pH:** {soil['effective_ph']:.1f}\n\n"
                f"#### Top Recommended Crops:\n\n{crops_text}\n\n"
                f"💡 **Recommendation:** If you are currently growing **{crop_state['current_crop']}**, consider rotating into **{top_3[0]['crop_name']}** to break pest cycles and replenish soil structure."
            )
            follow_ups = [
                f"How do I rotate {top_3[0]['crop_name']} into my farm?",
                "What are the water requirements for these crops?",
                "Simulate a drought scenario for this recommendation.",
            ]
            return advice, follow_ups

        # Intent 4: Soil pH, Acidity, Liming, Fertilizers
        if any(w in msg for w in ["soil", "ph", "acidity", "lime", "fertilizer", "npk", "nutrient", "carbon"]):
            tools_executed.append({
                "tool_name": "get_soil_analysis",
                "description": "Queried farm soil chemical and physical profile",
                "summary_result": f"Effective pH: {soil['effective_ph']} ({soil['ph_category']}), OC: {soil['organic_carbon_pct']}%, Lab test: {'Yes' if soil['has_lab_test'] else 'No (Modelled)'}",
            })
            citations.append("ICAR-CTCRI Tuber & Plantation Crop Soil Health Advisory")

            ph = soil["effective_ph"]
            ph_status = soil["ph_category"]
            lab_test = soil["has_lab_test"]

            if not lab_test:
                advice = (
                    f"### Soil Profile & Nutrient Intelligence for **{farm.farm_name}**\n\n"
                    f"- **Soil Source:** {soil['data_source_used']}\n"
                    f"- **Estimated pH:** **{ph:.2f}** ({ph_status})\n"
                    f"- **Estimated Organic Carbon:** {soil['organic_carbon_pct']:.2f}%\n"
                    f"- **Texture Class:** {soil['effective_texture']}\n\n"
                    f"> ⚠️ **Crucial Scientific Limitation:**\n"
                    f"> We do not compute synthetic N-P-K nutrient recommendations for your farm because **no physical laboratory test has been submitted**! Satellite sensors and ISRIC SoilGrids cannot measure bioavailable Nitrogen, Phosphorus, or Potassium.\n\n"
                    f"#### Recommended Immediate Actions:\n"
                    f"1. **Submit Soil Sample:** Take a composite sample from 15cm depth across your {twin['area']['acres']:.1f}-acre plot and submit it to your nearest Krishi Bhavan soil testing laboratory.\n"
                    f"2. **Liming for Kerala Lateritic Soils:** If your pH of {ph:.1f} is confirmed, apply agricultural lime (calcium carbonate) or dolomite at **250 to 500 kg/ha** before pre-monsoon showers.\n"
                    f"3. **Organic Carbon Enrichment:** Maintain soil cover using green manure (e.g., Sesbania / Cowpea) or incorporate well-decomposed FYM at **10-15 tonnes/ha**."
                )
            else:
                npk = soil["npk_status"]
                advice = (
                    f"### Verified Soil Health Analysis for **{farm.farm_name}**\n\n"
                    f"- **Laboratory Source:** {soil['data_source_used']}\n"
                    f"- **Measured pH:** **{ph:.2f}** ({ph_status})\n"
                    f"- **Available Nitrogen (N):** {npk.get('available_n_kg_ha')} kg/ha\n"
                    f"- **Available Phosphorus (P):** {npk.get('available_p_kg_ha')} kg/ha\n"
                    f"- **Available Potassium (K):** {npk.get('available_k_kg_ha')} kg/ha\n"
                    f"- **Organic Carbon:** {soil['organic_carbon_pct']:.2f}%\n\n"
                    f"#### Agronomic Guidance (KAU Package of Practices):\n"
                    f"- **Liming:** Apply dolomite or agricultural lime 2 to 3 weeks prior to primary basal fertilizer application to avoid ammonia volatilization.\n"
                    f"- **Phosphorus Efficiency:** In acid soils (pH < 6.0), use rock phosphate (Mussoorie Rock Phosphate) instead of superphosphate for extended residual availability."
                )

            follow_ups = [
                "What crop suits this soil pH best?",
                "How do I submit a soil test to Krishi Bhavan?",
                "Can you suggest a green manure rotation?",
            ]
            return advice, follow_ups
            tools_executed.append({
                "tool_name": "evaluate_crop_suitability",
                "description": "Computed multi-factor weighted crop suitability scores for Kerala agro-ecological zones",
                "summary_result": "Evaluated 12 regionally validated crops against current climate and terrain constraints",
            })
            evaluations = CropService.evaluate_farm_suitability(db, farm.id)
            top_3 = evaluations["crops"][:3]

            crops_text = "\n".join([
                f"{i+1}. **{c['crop_name']}** (`{c['scientific_name']}`)\n"
                f"   - **Suitability Score:** **{c['suitability_score']:.1f}/100** ({c['suitability_class']})\n"
                f"   - **Growth Duration:** {c['duration_days']}\n"
                f"   - **Key Advantage:** {', '.join(c['supporting_factors'][:2]) if c['supporting_factors'] else 'Regional climate fit'}\n"
                f"   - **Planting Window:** {c['planting_window']}"
                for i, c in enumerate(top_3)
            ])

            advice = (
                f"### Crop Suitability Evaluation for **{farm.farm_name}**\n\n"
                f"Based on your current farm telemetry:\n"
                f"- **30-Day NASA Rainfall:** {env['cumulative_rainfall_30d_mm']:.1f} mm\n"
                f"- **Mean Ambient Temperature:** {env['avg_temperature_c']:.1f} °C\n"
                f"- **Mean Slope:** {terrain['slope_mean_deg']:.1f}° ({terrain['slope_class']})\n"
                f"- **Soil pH:** {soil['effective_ph']:.1f}\n\n"
                f"#### Top Recommended Crops:\n\n{crops_text}\n\n"
                f"💡 **Recommendation:** If you are currently growing **{crop_state['current_crop']}**, consider rotating into **{top_3[0]['crop_name']}** to break pest cycles and replenish soil structure."
            )
            follow_ups = [
                f"How do I rotate {top_3[0]['crop_name']} into my farm?",
                "What are the water requirements for these crops?",
                "Simulate a drought scenario for this recommendation.",
            ]
            return advice, follow_ups

        # Intent 3: Weather, Rain, Rainfall, Temperature, Moisture
        if any(w in msg for w in ["rain", "weather", "temp", "climate", "rainfall", "monsoon", "drought", "dry"]):
            tools_executed.append({
                "tool_name": "get_nasa_weather_observations",
                "description": "Queried NASA GPM IMERG and NASA POWER daily records for farm coordinates",
                "summary_result": f"30d Rain: {env['cumulative_rainfall_30d_mm']:.1f} mm, Avg Temp: {env['avg_temperature_c']:.1f}°C, SMAP Surface Moisture: {env['smap_moisture_m3m3']} m3/m3",
            })
            citations.append("NASA Global Precipitation Measurement (GPM) IMERG v07")

            advice = (
                f"### NASA Earth Observation Weather Summary for **{farm.farm_name}**\n\n"
                f"Retrieved from NASA GPM IMERG and NASA POWER agroclimatology:\n\n"
                f"- **30-Day Cumulative Precipitation:** **{env['cumulative_rainfall_30d_mm']:.1f} mm**\n"
                f"- **Mean Air Temperature (2m):** **{env['avg_temperature_c']:.1f} °C**\n"
                f"- **NASA SMAP Surface Soil Moisture:** **{env['smap_moisture_m3m3']:.3f} m³/m³** ({env['smap_regional_status']})\n"
                f"- **Foliar Moisture Stress (NDMI):** {veg['latest_ndmi']:.3f}\n\n"
                f"#### Interpretation & Farm Action:\n"
            )
            if env["cumulative_rainfall_30d_mm"] > 300:
                advice += (
                    f"- 🌧️ **High Rainfall Warning:** Heavy rainfall has been observed over your coordinates ({farm.latitude:.3f}°N, {farm.longitude:.3f}°E). "
                    f"Ensure bunds, drainage contours, and runoff trenches are clear to avoid root rot in susceptible crops like Cassava and Ginger."
                )
            elif env["cumulative_rainfall_30d_mm"] < 50:
                advice += (
                    f"- ☀️ **Dry Spell Advisory:** Rainfall has been below seasonal normals. "
                    f"If supplementary irrigation is available ({'Active' if crop_state['irrigation_active'] else 'Inactive'}), schedule drip irrigation in early mornings to minimize evaporative loss."
                )
            else:
                advice += "- 🌿 **Optimal Moisture Balance:** Rainfall and root-zone moisture are currently within stable agronomic ranges for tropical cropping."

            follow_ups = [
                "Does my terrain risk waterlogging with this rainfall?",
                "Show me the 7-day rainfall trend.",
                "How does this affect my current crop?",
            ]
            return advice, follow_ups

        # Intent 4: Terrain, Waterlogging, Drainage, Slope
        if any(w in msg for w in ["terrain", "slope", "waterlog", "drain", "flood", "pooling", "erosion"]):
            tools_executed.append({
                "tool_name": "get_terrain_hydrology",
                "description": "Computed NASADEM digital elevation model topographic wetness index and flow accumulation",
                "summary_result": f"Slope: {terrain['slope_mean_deg']:.1f} deg, Relief: {terrain['relief_m']:.1f}m, Drainage: {terrain['drainage_assessment']}",
            })
            citations.append("NASA Shuttle Radar Topography Mission (SRTM) / NASADEM 30m DEM")

            advice = (
                f"### Topography & Hydrological Drainage for **{farm.farm_name}**\n\n"
                f"- **Elevation Range:** {terrain['elevation_min_m']:.1f} m to {terrain['elevation_max_m']:.1f} m (Relief: {terrain['relief_m']:.1f} m)\n"
                f"- **Mean Slope:** **{terrain['slope_mean_deg']:.1f}°** ({terrain['slope_class']})\n"
                f"- **Aspect:** {terrain['aspect_dominant']}\n"
                f"- **Topographic Wetness Index (TWI):** {terrain['topographic_wetness_index']:.2f}\n"
                f"- **Flow Accumulation Risk:** **{terrain['flow_accumulation_risk']}**\n"
                f"- **Farmer Waterlogging Flag:** {'⚠️ Marked by farmer' if terrain['farmer_marked_waterlogging'] else 'Not flagged'}\n\n"
                f"#### Drainage Assessment & Field Management:\n"
                f"- **Hydrological Class:** {terrain['drainage_assessment']}\n"
                f"- **Erosion & Runoff Control:** On slopes above 5°, contour bunding and vetiver grass planting along terrace edges prevent topsoil loss during monsoons.\n"
                f"- **Lowland Sinks:** In concave convergence zones (high TWI), construct peripheral drainage ditches or plant tolerant crops like Rice or Colocasia."
            )
            follow_ups = [
                "Which crops tolerate waterlogging best?",
                "How do I mark or unmark a waterlogging area?",
                "Can you simulate heavy monsoon runoff?",
            ]
            return advice, follow_ups

        # Intent 5: Crop Rotation, Strategy, Sequence
        if any(w in msg for w in ["rotation", "sequence", "strategy", "rotate", "after", "preceding", "follow"]):
            tools_executed.append({
                "tool_name": "optimize_crop_rotation",
                "description": "Generated multi-year rotation trajectories using agronomic family constraints and soil replenishment rules",
                "summary_result": "Built 3 alternative plans: Soil Health, Water Efficiency, and Balanced",
            })
            citations.append("KAU Principles of Agronomy & Cropping Systems")

            rotation_plans = RotationOptimizer.generate_strategies_for_farm(db, farm)
            strat_summary = []
            for s in rotation_plans:
                first_2_steps = " ➔ ".join([f"{step['crop_name']} ({step['season']})" for step in s['steps'][:2]])
                strat_summary.append(
                    f"- **{s['strategy_name']}** (Score: **{s['overall_score']:.1f}**)\n"
                    f"  - Sequence: {first_2_steps} ➔ ...\n"
                    f"  - Primary Objective: {s.get('soil_benefit_summary', s.get('strategy_name'))}"
                )

            advice = (
                f"### Crop Rotation Strategy Plans for **{farm.farm_name}**\n\n"
                f"Your farm is currently growing **{crop_state['current_crop']}** ({farm.total_area_acres:.1f} acres, {farm.farming_priorities}).\n\n"
                f"Here are the 3 algorithmic rotation pathways optimized for your soil and climate:\n\n"
                + "\n\n".join(strat_summary) +
                f"\n\n#### Why Legume Integration Matters:\n"
                f"Rotating heavy feeders (like Banana or Rice) with nitrogen-fixing pulses (Cowpea or Green Gram) fixes 40–80 kg N/ha naturally, reduces synthetic urea dependence, and disrupts monophagous nematode life cycles."
            )
            follow_ups = [
                "Tell me more about the Soil Health strategy.",
                "How much nitrogen does Cowpea add to the soil?",
                "What happens if I delay planting by 3 weeks?",
            ]
            return advice, follow_ups

        # Intent 6: What-If Simulation
        if any(w in msg for w in ["simulate", "what if", "scenario", "drought", "delay", "failure", "fail"]):
            tools_executed.append({
                "tool_name": "simulate_farm_scenario",
                "description": "Evaluated climate and agronomic perturbation against the digital twin state",
                "summary_result": "Ran simulation with -35% rainfall perturbation and rainfed conditions",
            })

            # Run default what-if simulation for demonstration
            sim = DigitalTwinService.simulate_scenario(
                db=db,
                farm_id=farm.id,
                simulated_crop="Cassava / Tapioca",
                rainfall_delta_pct=-35.0,
                irrigation_active=False,
                planting_delay_days=14,
            )

            consequences_list = "\n".join([f"- {c}" for c in sim["consequences"]])
            advice = (
                f"### What-If Scenario Simulation Result for **{farm.farm_name}**\n\n"
                f"**Scenario Tested:**\n"
                f"- **Crop:** {sim['scenario_inputs']['simulated_crop']}\n"
                f"- **Rainfall Deficit:** {sim['scenario_inputs']['rainfall_variation_pct']}\n"
                f"- **Irrigation:** Rainfed (No supplemental watering)\n"
                f"- **Planting Delay:** {sim['scenario_inputs']['planting_delay_days']} days\n\n"
                f"#### Projected Impact:\n"
                f"- **Recalculated Suitability:** **{sim['recalculated_suitability']['score']:.1f}/100** ({sim['recalculated_suitability']['class']})\n"
                f"- **Composite Risk Score:** **{sim['projected_risk_score']:.1f}/100** ({sim['projected_risk_level']})\n\n"
                f"#### Predicted Consequences:\n"
                f"{consequences_list}\n\n"
                f"> ℹ️ *{sim['scientific_disclaimer']}*"
            )
            follow_ups = [
                "How do I buffer against this drought risk?",
                "What crop would perform better under drought?",
                "Can I simulate an extreme rainfall scenario?",
            ]
            return advice, follow_ups

        # Default / Overview Intent
        tools_executed.append({
            "tool_name": "synthesize_farm_advisory",
            "description": "Synthesized current digital twin state and active risk indicators",
            "summary_result": f"Farm Health: {100 - risk['overall_risk_score']}% stable, Active crop: {crop_state['current_crop']}",
        })

        risk_bullets = "\n".join([
            f"- **{f['factor']}** ({f['severity'].upper()}): {f['detail']}"
            for f in risk["risk_factors"]
        ]) if risk["risk_factors"] else "- No critical agronomic risks currently detected."

        advice = (
            f"Hello! I am your **FieldShift AI Farm Assistant**, monitoring **{farm.farm_name}** in {farm.location_name}.\n\n"
            f"### Current Farm Snapshot:\n"
            f"- **Active Crop:** **{crop_state['current_crop']}** (Planted: {crop_state['planting_date'] or 'Unspecified'})\n"
            f"- **Area:** {twin['area']['acres']:.2f} acres ({twin['area']['hectares']:.2f} ha)\n"
            f"- **Overall Risk Level:** **{risk['overall_risk_score']}/100** ({risk['risk_level']})\n"
            f"- **Data Completeness:** {twin['data_completeness_pct']}%\n"
            f"- **Latest NDVI Greenness:** {veg['latest_ndvi']:.2f} ({veg['canopy_status']})\n"
            f"- **30-Day NASA Rainfall:** {env['cumulative_rainfall_30d_mm']:.1f} mm\n\n"
            f"#### Active Farm Watchlist:\n"
            f"{risk_bullets}\n\n"
            f"You can ask me anything about your farm's **crops, soil health, NASA rainfall observations, terrain drainage, multi-year crop rotations**, or ask me to **simulate a what-if scenario**."
        )
        follow_ups = [
            "What crops are most suitable for my farm right now?",
            "How is my soil health and should I apply lime?",
            "What crop rotation strategy do you recommend?",
            "What happens if next month brings a drought?",
        ]
        return advice, follow_ups

    @classmethod
    def get_prompt_suggestions(cls, db: Session, farm_id: str) -> List[Dict[str, str]]:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        crop = farm.current_crop if farm and farm.current_crop else "crops"
        return [
            {
                "category": "Crop Suitability",
                "prompt": f"Which crops are most suitable for my soil and climate right now?",
                "description": "Ranks 12 regionally validated crops based on NASA weather and SoilGrids data.",
            },
            {
                "category": "Soil & Fertilizers",
                "prompt": "How healthy is my soil and do I need to apply lime?",
                "description": "Reviews measured or modelled pH, organic carbon, and missing test warnings.",
            },
            {
                "category": "Weather Intelligence",
                "prompt": "How much rainfall has fallen on my farm over the last 30 days?",
                "description": "Summarizes NASA GPM IMERG satellite precipitation and SMAP soil moisture.",
            },
            {
                "category": "Crop Rotation",
                "prompt": f"What is the best 3-year crop rotation sequence to follow after {crop}?",
                "description": "Presents Soil Health, Water Efficiency, and Balanced rotation trajectories.",
            },
            {
                "category": "What-If Simulator",
                "prompt": "What happens if rainfall drops by 40% and irrigation fails?",
                "description": "Runs digital twin stress simulation to predict yield and risk impact.",
            },
        ]
