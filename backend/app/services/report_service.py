from typing import Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.farm import Farm
from app.models.task import Task
from app.services.digital_twin_service import DigitalTwinService
from app.services.crop_service import CropService
from app.services.rotation_optimizer import RotationOptimizer


class ReportService:
    """
    Comprehensive Agricultural Decision-Support Dossier Generator.
    Synthesizes multi-source Earth observations, soil profile, terrain hydrology,
    crop suitability scores, and rotation strategies into an exportable intelligence report.
    """

    @classmethod
    async def generate_farm_report(cls, db: Session, farm_id: str) -> Dict[str, Any]:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise ValueError(f"Farm with ID {farm_id} not found.")

        # 1. Fetch live digital twin synthesis
        twin = await DigitalTwinService.get_or_create_twin(db, farm)
        soil = twin["soil_state"]
        terrain = twin["terrain_state"]
        env = twin["environmental_state"]
        veg = twin["vegetation_state"]
        risk = twin["risk_assessment"]

        # 2. Fetch crop suitability rankings
        crops_eval = []
        crops_to_eval = CropService.list_crops(db)
        for c in crops_to_eval:
            res = CropService.calculate_suitability(
                crop=c,
                ph=soil["effective_ph"],
                texture=soil["effective_texture"],
                avg_temp=env["avg_temperature_c"],
                rainfall_30d=env["cumulative_rainfall_30d_mm"],
                irrigation_available=farm.irrigation_available,
                slope_deg=terrain["slope_mean_deg"],
                flow_risk=terrain["flow_accumulation_risk"],
                has_lab_test=soil["has_lab_test"],
            )
            crops_eval.append(res)
        crops_eval.sort(key=lambda x: x["suitability_score"], reverse=True)
        top_crops = crops_eval[:5]

        # 3. Fetch rotation strategies
        rotations = RotationOptimizer.generate_strategies_for_farm(db, farm)

        # 4. Fetch pending tasks
        pending_tasks = (
            db.query(Task)
            .filter(Task.farm_id == farm.id, Task.status == "pending")
            .order_by(Task.priority.asc(), Task.due_date.asc())
            .all()
        )

        now_str = datetime.now(timezone.utc).strftime("%d %B %Y, %H:%M UTC")

        # 5. Build Markdown Dossier
        md_report = f"""# FieldShift AI: Farm Intelligence & Adaptation Report
**Report Date:** {now_str}  
**Challenge:** NASA Space Apps Challenge 2026 • Field Shift: Adapting Farms with NASA Data  
**Regional Agro-Ecological Context:** {farm.location_name}

---

## 1. Executive Farm Summary
- **Farm Name:** {farm.farm_name}
- **Centroid Coordinates:** {farm.latitude:.4f}° N, {farm.longitude:.4f}° E
- **Surveyed Area:** {farm.total_area_hectares:.2f} ha ({farm.total_area_acres:.2f} acres)
- **Active Primary Crop:** {farm.current_crop or 'Unspecified'}
- **Irrigation Infrastructure:** {'Operational / Active' if farm.irrigation_available else 'Rainfed'}
- **Farming Priorities:** {farm.farming_priorities or 'Soil Health & Sustainable Yield'}
- **Digital Twin Health Completeness:** {twin['data_completeness_pct']}%
- **Composite Risk Rating:** {risk['overall_risk_score']}/100 ({risk['risk_level']})

---

## 2. NASA Earth Observation Digest
- **NASA GPM IMERG 30-Day Precipitation:** **{env['cumulative_rainfall_30d_mm']:.1f} mm**
- **NASA POWER 2m Air Temperature:** **{env['avg_temperature_c']:.1f} °C**
- **NASA SMAP L4 Surface Soil Moisture:** **{env['smap_moisture_m3m3']:.3f} m³/m³** ({env['smap_regional_status']})
- **Landsat / Sentinel-2 NDVI (Foliar Greenness):** **{veg['latest_ndvi']:.2f}** ({veg['canopy_status']})
- **Landsat / Sentinel-2 NDMI (Canopy Moisture Stress):** **{veg['latest_ndmi']:.2f}**

---

## 3. Soil Intelligence & Nutrient Baseline
- **Data Source Used:** {soil['data_source_used']}
- **Certified Physical Lab Test On Record:** {'Yes (Verified)' if soil['has_lab_test'] else 'No (ISRIC SoilGrids Modelled Baseline)'}
- **Effective Reaction (pH):** **{soil['effective_ph']:.2f}** ({soil['ph_category']})
- **Soil Texture Classification:** {soil['effective_texture']}
- **Organic Carbon Content:** {soil['organic_carbon_pct']:.2f}%
- **Agronomic Liming Advisory:** {soil['ph_recommendation']}

> ⚠️ **Scientific Safeguard Notice:** Synthetic NPK fertilizer recommendations are withheld until a certified physical soil test from Krishi Bhavan is recorded.

---

## 4. Terrain & Hydrological Vulnerability
- **Elevation Range:** {terrain['elevation_min_m']:.1f} m to {terrain['elevation_max_m']:.1f} m (Relief: {terrain['relief_m']:.1f} m)
- **Mean Slope:** {terrain['slope_mean_deg']:.1f}° ({terrain['slope_class']})
- **Aspect:** {terrain['aspect_dominant']}
- **Topographic Wetness Index (TWI):** {terrain['topographic_wetness_index']:.2f}
- **Drainage & Runoff Assessment:** {terrain['drainage_assessment']}
- **Flow Accumulation Risk:** {terrain['flow_accumulation_risk']}
- **Farmer Waterlogging Flag:** {'Marked by Farmer' if terrain['farmer_marked_waterlogging'] else 'Not flagged'}

---

## 5. Crop Suitability Rankings (Kerala Agro-Ecological Models)
"""
        for i, c in enumerate(top_crops):
            md_report += f"\n### {i+1}. {c['crop_name']} (`{c['scientific_name']}`) — Score: {c['suitability_score']:.1f}/100 ({c['suitability_class']})\n"
            md_report += f"- **Growth Duration:** {c['duration_days']}\n"
            md_report += f"- **Component Breakdown:** Soil: {c['component_scores']['soil_score']:.0f} | Climate: {c['component_scores']['climate_score']:.0f} | Water: {c['component_scores']['water_score']:.0f} | Drainage: {c['component_scores']['drainage_score']:.0f} | Season: {c['component_scores']['seasonal_score']:.0f}\n"
            if c['supporting_factors']:
                md_report += f"- **Key Advantages:** {', '.join(c['supporting_factors'])}\n"
            if c['limitations']:
                md_report += f"- **Agronomic Watchouts:** {', '.join(c['limitations'])}\n"

        md_report += f"""
---

## 6. Algorithmic Multi-Year Crop Rotation Trajectories
"""
        for s in rotations:
            desc = s.get("soil_benefit_summary") or s.get("description", "Optimized rotation plan")
            md_report += f"\n### Strategy: {s['strategy_name']} (Suitability Score: {s['overall_score']:.1f}/100)\n"
            md_report += f"*{desc}*\n\n"
            for step in s['steps']:
                benefit = step.get("notes") or step.get("agronomic_benefit") or step.get("role", "")
                md_report += f"- **{step['season']} (Year {step['year']}):** {step['crop_name']} — *{benefit}*\n"

        md_report += f"""
---

## 7. Actionable Tasks & Next Steps
"""
        if pending_tasks:
            for t in pending_tasks:
                md_report += f"- [ ] **[{t.priority.upper()}] {t.title}** (Due: {t.due_date or 'Immediate'})\n  {t.description}\n"
        else:
            md_report += "No outstanding high-risk tasks. Farm operations are within recommended parameters.\n"

        md_report += f"""
---
*Generated by FieldShift AI • Autonomous Agricultural Decision Support Platform*  
*Grounding: Kerala Agricultural University (KAU) & NASA Earth Observation System*
"""

        return {
            "farm_id": farm.id,
            "farm_name": farm.farm_name,
            "generated_at": now_str,
            "markdown_report": md_report,
            "summary_kpis": {
                "risk_score": risk["overall_risk_score"],
                "risk_level": risk["risk_level"],
                "rainfall_30d_mm": env["cumulative_rainfall_30d_mm"],
                "effective_ph": soil["effective_ph"],
                "ph_category": soil["ph_category"],
                "slope_deg": terrain["slope_mean_deg"],
                "top_crop": top_crops[0]["crop_name"] if top_crops else "None",
                "top_crop_score": top_crops[0]["suitability_score"] if top_crops else 0,
                "pending_tasks_count": len(pending_tasks),
            },
            "top_crops": top_crops,
            "rotation_strategies": rotations,
            "pending_tasks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "priority": t.priority,
                    "category": t.category,
                    "due_date": t.due_date,
                    "description": t.description,
                }
                for t in pending_tasks
            ],
        }
