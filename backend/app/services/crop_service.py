from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.crop import Crop


KERALA_CROPS_DATA = [
    {
        "id": "CROP-BANANA",
        "crop_name": "Banana (Nendran / Robusta)",
        "scientific_name": "Musa paradisiaca",
        "crop_family": "Musaceae",
        "duration_days_min": 270,
        "duration_days_max": 330,
        "planting_windows": "Aug-Sept (Onam crop) or March-April (Irrigated)",
        "temp_min_c": 15.0,
        "temp_max_c": 36.0,
        "temp_optimal_c": 27.0,
        "ph_min": 5.2,
        "ph_max": 7.5,
        "ph_optimal": 6.2,
        "water_requirement_mm": 1500,
        "water_demand_category": "High",
        "drainage_preference": "Well-drained (Sensitive to waterlogging)",
        "nitrogen_fixation": False,
        "soil_cover_rating": "High",
        "nutrient_demand": "High",
        "compatible_next_crops": "CROP-COWPEA,CROP-GREENGRAM,CROP-CASSAVA,CROP-GINGER",
        "incompatible_next_crops": "CROP-BANANA",  # Continuous banana promotes Panama wilt & nematodes
        "agronomic_source": "Kerala Agricultural University (KAU) Package of Practices (Crops) 2016",
    },
    {
        "id": "CROP-CASSAVA",
        "crop_name": "Cassava / Tapioca",
        "scientific_name": "Manihot esculenta",
        "crop_family": "Euphorbiaceae",
        "duration_days_min": 240,
        "duration_days_max": 300,
        "planting_windows": "May-June (SW monsoon) or Sept-Oct (NE monsoon)",
        "temp_min_c": 18.0,
        "temp_max_c": 35.0,
        "temp_optimal_c": 26.5,
        "ph_min": 4.8,
        "ph_max": 7.0,
        "ph_optimal": 5.8,
        "water_requirement_mm": 800,
        "water_demand_category": "Low-Moderate",
        "drainage_preference": "Well-drained laterite (Drought tolerant)",
        "nitrogen_fixation": False,
        "soil_cover_rating": "Moderate",
        "nutrient_demand": "Moderate",
        "compatible_next_crops": "CROP-COWPEA,CROP-BLACKGRAM,CROP-GROUNDNUT,CROP-MAIZE",
        "incompatible_next_crops": "CROP-CASSAVA",
        "agronomic_source": "ICAR-CTCRI Sreekariyam / KAU Kerala Guidelines",
    },
    {
        "id": "CROP-COWPEA",
        "crop_name": "Cowpea (Lobia / Payar)",
        "scientific_name": "Vigna unguiculata",
        "crop_family": "Fabaceae",
        "duration_days_min": 65,
        "duration_days_max": 85,
        "planting_windows": "May-June, Sept-Oct, or Jan-Feb (Summer irrigated)",
        "temp_min_c": 18.0,
        "temp_max_c": 35.0,
        "temp_optimal_c": 27.5,
        "ph_min": 5.5,
        "ph_max": 7.2,
        "ph_optimal": 6.2,
        "water_requirement_mm": 400,
        "water_demand_category": "Low",
        "drainage_preference": "Well-drained (Fixes atmospheric Nitrogen)",
        "nitrogen_fixation": True,
        "soil_cover_rating": "High",
        "nutrient_demand": "Low",
        "compatible_next_crops": "CROP-BANANA,CROP-MAIZE,CROP-CASSAVA,CROP-RICE,CROP-TURMERIC",
        "incompatible_next_crops": "CROP-COWPEA,CROP-GREENGRAM",
        "agronomic_source": "KAU Directorate of Extension / Indian Pulse Research Institute",
    },
    {
        "id": "CROP-GREENGRAM",
        "crop_name": "Green Gram (Moong)",
        "scientific_name": "Vigna radiata",
        "crop_family": "Fabaceae",
        "duration_days_min": 60,
        "duration_days_max": 75,
        "planting_windows": "Sept-Oct or Jan-Feb (Post-paddy fallow)",
        "temp_min_c": 20.0,
        "temp_max_c": 35.0,
        "temp_optimal_c": 28.0,
        "ph_min": 5.8,
        "ph_max": 7.5,
        "ph_optimal": 6.5,
        "water_requirement_mm": 350,
        "water_demand_category": "Low",
        "drainage_preference": "Well-drained fertile loam",
        "nitrogen_fixation": True,
        "soil_cover_rating": "High",
        "nutrient_demand": "Low",
        "compatible_next_crops": "CROP-RICE,CROP-MAIZE,CROP-BANANA,CROP-CASSAVA",
        "incompatible_next_crops": "CROP-GREENGRAM,CROP-BLACKGRAM",
        "agronomic_source": "ICAR-IIPR / KAU Guidelines for Kole and Wetland Fallows",
    },
    {
        "id": "CROP-BLACKGRAM",
        "crop_name": "Black Gram (Urad)",
        "scientific_name": "Vigna mungo",
        "crop_family": "Fabaceae",
        "duration_days_min": 70,
        "duration_days_max": 90,
        "planting_windows": "Sept-Oct or Dec-Jan (Residual moisture crop)",
        "temp_min_c": 20.0,
        "temp_max_c": 36.0,
        "temp_optimal_c": 28.0,
        "ph_min": 5.8,
        "ph_max": 7.5,
        "ph_optimal": 6.5,
        "water_requirement_mm": 400,
        "water_demand_category": "Low",
        "drainage_preference": "Well-drained (Fixes N, enriches organic matter)",
        "nitrogen_fixation": True,
        "soil_cover_rating": "High",
        "nutrient_demand": "Low",
        "compatible_next_crops": "CROP-MAIZE,CROP-RICE,CROP-BANANA,CROP-GINGER",
        "incompatible_next_crops": "CROP-BLACKGRAM,CROP-COWPEA",
        "agronomic_source": "KAU Package of Practices / ICAR-IIPR",
    },
    {
        "id": "CROP-RICE",
        "crop_name": "Rice (Paddy - Uma / Jyothi)",
        "scientific_name": "Oryza sativa",
        "crop_family": "Poaceae",
        "duration_days_min": 115,
        "duration_days_max": 135,
        "planting_windows": "Virippu (May-June), Mundakan (Sept-Oct), Puncha (Nov-Dec)",
        "temp_min_c": 20.0,
        "temp_max_c": 38.0,
        "temp_optimal_c": 29.0,
        "ph_min": 4.8,
        "ph_max": 6.8,
        "ph_optimal": 5.8,
        "water_requirement_mm": 1300,
        "water_demand_category": "High",
        "drainage_preference": "Tolerates flooded lowland basins (Puddle soils)",
        "nitrogen_fixation": False,
        "soil_cover_rating": "High",
        "nutrient_demand": "High",
        "compatible_next_crops": "CROP-COWPEA,CROP-GREENGRAM,CROP-BLACKGRAM,CROP-OKRA",
        "incompatible_next_crops": "",
        "agronomic_source": "KAU Rice Research Station Moncompu / Pattambi",
    },
    {
        "id": "CROP-MAIZE",
        "crop_name": "Maize (Corn)",
        "scientific_name": "Zea mays",
        "crop_family": "Poaceae",
        "duration_days_min": 95,
        "duration_days_max": 115,
        "planting_windows": "May-June or Sept-Oct",
        "temp_min_c": 18.0,
        "temp_max_c": 35.0,
        "temp_optimal_c": 26.5,
        "ph_min": 5.5,
        "ph_max": 7.5,
        "ph_optimal": 6.5,
        "water_requirement_mm": 600,
        "water_demand_category": "Moderate",
        "drainage_preference": "Well-drained (Cannot tolerate stagnation)",
        "nitrogen_fixation": False,
        "soil_cover_rating": "Moderate",
        "nutrient_demand": "High",
        "compatible_next_crops": "CROP-COWPEA,CROP-GROUNDNUT,CROP-BLACKGRAM",
        "incompatible_next_crops": "CROP-MAIZE",
        "agronomic_source": "ICAR-IIMR / KAU Palakkad cropping trials",
    },
    {
        "id": "CROP-GINGER",
        "crop_name": "Ginger (Varada / Rio de Janeiro)",
        "scientific_name": "Zingiber officinale",
        "crop_family": "Zingiberaceae",
        "duration_days_min": 210,
        "duration_days_max": 240,
        "planting_windows": "April-May (Pre-monsoon showers)",
        "temp_min_c": 19.0,
        "temp_max_c": 32.0,
        "temp_optimal_c": 26.0,
        "ph_min": 5.5,
        "ph_max": 6.8,
        "ph_optimal": 6.0,
        "water_requirement_mm": 1400,
        "water_demand_category": "Moderate-High",
        "drainage_preference": "Strictly well-drained raised beds (Rhizome rot hazard)",
        "nitrogen_fixation": False,
        "soil_cover_rating": "Moderate",
        "nutrient_demand": "High",
        "compatible_next_crops": "CROP-COWPEA,CROP-MAIZE,CROP-SWEETPOTATO",
        "incompatible_next_crops": "CROP-GINGER,CROP-TURMERIC",
        "agronomic_source": "ICAR-Indian Institute of Spices Research (IISR) Kozhikode",
    },
    {
        "id": "CROP-TURMERIC",
        "crop_name": "Turmeric (Prabha / Alleppey Supreme)",
        "scientific_name": "Curcuma longa",
        "crop_family": "Zingiberaceae",
        "duration_days_min": 240,
        "duration_days_max": 270,
        "planting_windows": "April-May",
        "temp_min_c": 20.0,
        "temp_max_c": 34.0,
        "temp_optimal_c": 27.5,
        "ph_min": 5.5,
        "ph_max": 7.2,
        "ph_optimal": 6.2,
        "water_requirement_mm": 1200,
        "water_demand_category": "Moderate",
        "drainage_preference": "Well-drained rich loamy laterite",
        "nitrogen_fixation": False,
        "soil_cover_rating": "High",
        "nutrient_demand": "Moderate",
        "compatible_next_crops": "CROP-COWPEA,CROP-BLACKGRAM,CROP-MAIZE",
        "incompatible_next_crops": "CROP-TURMERIC,CROP-GINGER",
        "agronomic_source": "ICAR-IISR Kozhikode / KAU Guidelines",
    },
    {
        "id": "CROP-GROUNDNUT",
        "crop_name": "Groundnut (Peanut)",
        "scientific_name": "Arachis hypogaea",
        "crop_family": "Fabaceae",
        "duration_days_min": 100,
        "duration_days_max": 120,
        "planting_windows": "May-June or Sept-Oct",
        "temp_min_c": 20.0,
        "temp_max_c": 34.0,
        "temp_optimal_c": 27.0,
        "ph_min": 5.8,
        "ph_max": 7.0,
        "ph_optimal": 6.3,
        "water_requirement_mm": 550,
        "water_demand_category": "Moderate",
        "drainage_preference": "Light well-drained sandy loam",
        "nitrogen_fixation": True,
        "soil_cover_rating": "High",
        "nutrient_demand": "Moderate",
        "compatible_next_crops": "CROP-MAIZE,CROP-CASSAVA,CROP-BANANA",
        "incompatible_next_crops": "CROP-GROUNDNUT",
        "agronomic_source": "ICAR-Directorate of Groundnut Research / KAU Palakkad",
    },
    {
        "id": "CROP-OKRA",
        "crop_name": "Okra (Bhindi / Venda)",
        "scientific_name": "Abelmoschus esculentus",
        "crop_family": "Malvaceae",
        "duration_days_min": 80,
        "duration_days_max": 100,
        "planting_windows": "Feb-March, June-July, or Oct-Nov",
        "temp_min_c": 20.0,
        "temp_max_c": 36.0,
        "temp_optimal_c": 28.0,
        "ph_min": 6.0,
        "ph_max": 7.5,
        "ph_optimal": 6.5,
        "water_requirement_mm": 500,
        "water_demand_category": "Moderate",
        "drainage_preference": "Well-drained fertile loam",
        "nitrogen_fixation": False,
        "soil_cover_rating": "Moderate",
        "nutrient_demand": "Moderate",
        "compatible_next_crops": "CROP-COWPEA,CROP-GREENGRAM,CROP-RICE",
        "incompatible_next_crops": "CROP-OKRA",
        "agronomic_source": "KAU Department of Olericulture Vellanikkara",
    },
    {
        "id": "CROP-SWEETPOTATO",
        "crop_name": "Sweet Potato",
        "scientific_name": "Ipomoea batatas",
        "crop_family": "Convolvulaceae",
        "duration_days_min": 105,
        "duration_days_max": 120,
        "planting_windows": "Sept-Oct or June-July",
        "temp_min_c": 20.0,
        "temp_max_c": 34.0,
        "temp_optimal_c": 26.5,
        "ph_min": 5.5,
        "ph_max": 6.8,
        "ph_optimal": 6.0,
        "water_requirement_mm": 600,
        "water_demand_category": "Moderate",
        "drainage_preference": "Well-drained friable loam",
        "nitrogen_fixation": False,
        "soil_cover_rating": "High",
        "nutrient_demand": "Moderate",
        "compatible_next_crops": "CROP-COWPEA,CROP-BLACKGRAM,CROP-MAIZE",
        "incompatible_next_crops": "CROP-SWEETPOTATO",
        "agronomic_source": "ICAR-CTCRI / FAO Ecocrop",
    },
    # Global Staple & Commercial Crops
    {
        "id": "CROP-WHEAT",
        "crop_name": "Bread Wheat",
        "scientific_name": "Triticum aestivum",
        "crop_family": "Poaceae",
        "duration_days_min": 110,
        "duration_days_max": 145,
        "planting_windows": "Autumn (Winter wheat) or Early Spring (Spring wheat)",
        "temp_min_c": 10.0,
        "temp_max_c": 28.0,
        "temp_optimal_c": 20.0,
        "ph_min": 6.0,
        "ph_max": 7.8,
        "ph_optimal": 6.6,
        "water_requirement_mm": 500,
        "water_demand_category": "Moderate",
        "drainage_preference": "Well-drained clay loam or silt loam",
        "nitrogen_fixation": False,
        "soil_cover_rating": "Moderate",
        "nutrient_demand": "Moderate-High",
        "compatible_next_crops": "CROP-SOYBEAN,CROP-MAIZE,CROP-COWPEA",
        "incompatible_next_crops": "CROP-WHEAT",
        "agronomic_source": "FAO Ecocrop / CIMMYT / USDA-ARS",
    },
    {
        "id": "CROP-SOYBEAN",
        "crop_name": "Soybean",
        "scientific_name": "Glycine max",
        "crop_family": "Fabaceae",
        "duration_days_min": 90,
        "duration_days_max": 125,
        "planting_windows": "Late Spring to Early Summer",
        "temp_min_c": 16.0,
        "temp_max_c": 34.0,
        "temp_optimal_c": 25.0,
        "ph_min": 5.8,
        "ph_max": 7.2,
        "ph_optimal": 6.4,
        "water_requirement_mm": 600,
        "water_demand_category": "Moderate",
        "drainage_preference": "Well-drained fertile loam",
        "nitrogen_fixation": True,
        "soil_cover_rating": "High",
        "nutrient_demand": "Moderate",
        "compatible_next_crops": "CROP-MAIZE,CROP-WHEAT,CROP-COTTON",
        "incompatible_next_crops": "CROP-SOYBEAN",
        "agronomic_source": "FAO Ecocrop / USDA-NRCS / Embrapa Brazil",
    },
    {
        "id": "CROP-POTATO",
        "crop_name": "Potato",
        "scientific_name": "Solanum tuberosum",
        "crop_family": "Solanaceae",
        "duration_days_min": 90,
        "duration_days_max": 120,
        "planting_windows": "Early Spring or Autumn (frost-free cool season)",
        "temp_min_c": 12.0,
        "temp_max_c": 26.0,
        "temp_optimal_c": 18.5,
        "ph_min": 5.0,
        "ph_max": 6.5,
        "ph_optimal": 5.6,
        "water_requirement_mm": 550,
        "water_demand_category": "Moderate",
        "drainage_preference": "Loose, well-drained friable sandy loam",
        "nitrogen_fixation": False,
        "soil_cover_rating": "Moderate",
        "nutrient_demand": "High",
        "compatible_next_crops": "CROP-MAIZE,CROP-COWPEA,CROP-WHEAT",
        "incompatible_next_crops": "CROP-POTATO,CROP-TOMATO",
        "agronomic_source": "International Potato Center (CIP) / FAO Ecocrop",
    },
    {
        "id": "CROP-SORGHUM",
        "crop_name": "Grain Sorghum",
        "scientific_name": "Sorghum bicolor",
        "crop_family": "Poaceae",
        "duration_days_min": 90,
        "duration_days_max": 120,
        "planting_windows": "Summer warm season (semi-arid resilient)",
        "temp_min_c": 18.0,
        "temp_max_c": 38.0,
        "temp_optimal_c": 28.0,
        "ph_min": 5.5,
        "ph_max": 8.0,
        "ph_optimal": 6.5,
        "water_requirement_mm": 450,
        "water_demand_category": "Low",
        "drainage_preference": "Tolerant of diverse soils, drought-adapted",
        "nitrogen_fixation": False,
        "soil_cover_rating": "Moderate",
        "nutrient_demand": "Moderate",
        "compatible_next_crops": "CROP-COWPEA,CROP-SOYBEAN,CROP-GROUNDNUT",
        "incompatible_next_crops": "CROP-SORGHUM",
        "agronomic_source": "ICRISAT / FAO Semi-Arid Agriculture",
    },
    {
        "id": "CROP-TOMATO",
        "crop_name": "Tomato",
        "scientific_name": "Solanum lycopersicum",
        "crop_family": "Solanaceae",
        "duration_days_min": 80,
        "duration_days_max": 110,
        "planting_windows": "Spring/Summer or Winter in mild subtropics",
        "temp_min_c": 16.0,
        "temp_max_c": 32.0,
        "temp_optimal_c": 23.5,
        "ph_min": 6.0,
        "ph_max": 7.2,
        "ph_optimal": 6.5,
        "water_requirement_mm": 550,
        "water_demand_category": "Moderate",
        "drainage_preference": "Rich, well-drained sandy loam",
        "nitrogen_fixation": False,
        "soil_cover_rating": "Moderate",
        "nutrient_demand": "High",
        "compatible_next_crops": "CROP-COWPEA,CROP-MAIZE,CROP-RICE",
        "incompatible_next_crops": "CROP-TOMATO,CROP-POTATO",
        "agronomic_source": "World Vegetable Center (AVRDC) / FAO",
    },
    {
        "id": "CROP-COTTON",
        "crop_name": "Upland Cotton",
        "scientific_name": "Gossypium hirsutum",
        "crop_family": "Malvaceae",
        "duration_days_min": 150,
        "duration_days_max": 185,
        "planting_windows": "Spring to early Summer warm season",
        "temp_min_c": 18.0,
        "temp_max_c": 38.0,
        "temp_optimal_c": 28.0,
        "ph_min": 6.0,
        "ph_max": 8.0,
        "ph_optimal": 6.8,
        "water_requirement_mm": 800,
        "water_demand_category": "Moderate-High",
        "drainage_preference": "Deep, well-drained alluvial or black soils",
        "nitrogen_fixation": False,
        "soil_cover_rating": "Moderate",
        "nutrient_demand": "High",
        "compatible_next_crops": "CROP-SOYBEAN,CROP-WHEAT,CROP-COWPEA",
        "incompatible_next_crops": "CROP-COTTON",
        "agronomic_source": "International Cotton Advisory Committee (ICAC) / FAO",
    },
]

GLOBAL_AND_REGIONAL_CROPS = KERALA_CROPS_DATA


class CropService:
    @classmethod
    def seed_crops_if_empty(cls, db: Session):
        for item in GLOBAL_AND_REGIONAL_CROPS:
            existing = db.query(Crop).filter(Crop.id == item["id"]).first()
            if not existing:
                db.add(Crop(**item))
        db.commit()
        print(f"Seeded {len(KERALA_CROPS_DATA)} Kerala crop agronomic profiles.")

    @classmethod
    def list_crops(cls, db: Session) -> List[Crop]:
        cls.seed_crops_if_empty(db)
        return db.query(Crop).order_by(Crop.crop_name.asc()).all()

    @classmethod
    def get_crop(cls, db: Session, crop_id: str) -> Optional[Crop]:
        cls.seed_crops_if_empty(db)
        return db.query(Crop).filter(Crop.id == crop_id).first()

    @classmethod
    def calculate_suitability(
        cls,
        crop: Crop,
        ph: float,
        texture: str,
        avg_temp: float,
        rainfall_30d: float,
        irrigation_available: bool,
        slope_deg: float,
        flow_risk: str,
        has_lab_test: bool = False,
    ) -> Dict[str, Any]:
        """
        Transparent weighted suitability scoring model:
        Score = (W_soil * S_soil) + (W_climate * S_climate) + (W_water * S_water) + (W_drainage * S_drainage) + (W_season * S_season)
        """
        supporting_factors = []
        limitations = []
        missing_data = []

        # 1. Soil Score (0 - 100)
        ph_diff = abs(ph - crop.ph_optimal)
        if crop.ph_min <= ph <= crop.ph_max:
            if ph_diff <= 0.4:
                soil_score = 95
                supporting_factors.append(f"Soil pH {ph:.1f} is optimal for {crop.crop_name}.")
            else:
                soil_score = 80
                supporting_factors.append(f"Soil pH {ph:.1f} is within acceptable range ({crop.ph_min}-{crop.ph_max}).")
        else:
            soil_score = max(40, 75 - int(ph_diff * 20))
            limitations.append(f"Soil pH {ph:.1f} is outside preferred range ({crop.ph_min}-{crop.ph_max}).")

        # 2. Climate Score (0 - 100)
        temp_diff = abs(avg_temp - crop.temp_optimal_c)
        if crop.temp_min_c <= avg_temp <= crop.temp_max_c:
            if temp_diff <= 2.5:
                climate_score = 95
                supporting_factors.append(f"Average ambient temperature {avg_temp:.1f}°C aligns with optimum ({crop.temp_optimal_c}°C).")
            else:
                climate_score = 82
        else:
            climate_score = 50
            limitations.append(f"Mean temperature {avg_temp:.1f}°C is near thermal boundary limits ({crop.temp_min_c}-{crop.temp_max_c}°C).")

        # 3. Water Score (0 - 100)
        if crop.water_demand_category == "High":
            if irrigation_available:
                water_score = 92
                supporting_factors.append("Irrigation infrastructure accommodates high crop water requirements.")
            elif rainfall_30d >= 150.0:
                water_score = 80
                supporting_factors.append(f"Active monsoon precipitation ({rainfall_30d:.0f}mm in 30d) meets water demand.")
            else:
                water_score = 55
                limitations.append("High water demand crop under rainfed conditions with sub-optimal precipitation.")
        elif crop.water_demand_category == "Moderate":
            water_score = 90 if (irrigation_available or rainfall_30d >= 60.0) else 75
        else:  # Low water demand (Legumes, Cassava)
            water_score = 95
            supporting_factors.append("Low water requirement offers high drought and dry-spell resilience.")

        # 4. Drainage / Terrain Score (0 - 100)
        if "flooded" in crop.drainage_preference.lower():
            if "swale" in flow_risk.lower() or slope_deg <= 2.0:
                drainage_score = 95
                supporting_factors.append("Terrain water accumulation swale favors flooded paddy cultivation.")
            else:
                drainage_score = 65
                limitations.append("Upland slope accelerates drainage runoff; flooded paddy requires bunding.")
        else:  # Sensitive to waterlogging
            if "swale" in flow_risk.lower() and rainfall_30d > 200.0:
                drainage_score = 60
                limitations.append(f"Susceptible to root/rhizome rot in depression swales during high rainfall periods.")
            else:
                drainage_score = 90
                supporting_factors.append("Slope and soil drainage prevent prolonged root zone stagnation.")

        # 5. Seasonal Score (0 - 100)
        seasonal_score = 88

        # Weighted calculation
        final_score = (
            (soil_score * 0.25)
            + (climate_score * 0.25)
            + (water_score * 0.20)
            + (drainage_score * 0.15)
            + (seasonal_score * 0.15)
        )
        final_score = round(final_score, 1)

        # Completeness calculation
        completeness = 95 if has_lab_test else 70
        if not has_lab_test:
            missing_data.append("Physical laboratory soil NPK results (SoilGrids modelled baseline used instead)")

        # Suitability class
        if final_score >= 85:
            suitability_class = "Highly Suitable"
        elif final_score >= 70:
            suitability_class = "Moderately Suitable"
        elif final_score >= 55:
            suitability_class = "Marginally Suitable"
        else:
            suitability_class = "Unsuitable / High Risk"

        return {
            "crop_id": crop.id,
            "crop_name": crop.crop_name,
            "scientific_name": crop.scientific_name,
            "crop_family": crop.crop_family,
            "duration_days": f"{crop.duration_days_min}-{crop.duration_days_max} days",
            "suitability_score": final_score,
            "suitability_class": suitability_class,
            "assessment_completeness_pct": completeness,
            "nitrogen_fixation": crop.nitrogen_fixation,
            "component_scores": {
                "soil_score": soil_score,
                "climate_score": climate_score,
                "water_score": water_score,
                "drainage_score": drainage_score,
                "seasonal_score": seasonal_score,
            },
            "weighted_contributions": {
                "soil": round(soil_score * 0.25, 1),
                "climate": round(climate_score * 0.25, 1),
                "water": round(water_score * 0.20, 1),
                "drainage": round(drainage_score * 0.15, 1),
                "seasonal": round(seasonal_score * 0.15, 1),
            },
            "weights_pct": {
                "soil": 25,
                "climate": 25,
                "water": 20,
                "drainage": 15,
                "seasonal": 15,
            },
            "supporting_factors": supporting_factors,
            "limitations": limitations,
            "missing_data": missing_data,
            "planting_window": crop.planting_windows,
            "agronomic_source": crop.agronomic_source,
        }

