from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_soil_terrain_crop_intelligence():
    # 1. Login as Thomas (Kanjirappally Farm)
    auth = client.post("/api/auth/demo-login?farmer_id=1")
    assert auth.status_code == 200
    token = auth.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get farms
    farms = client.get("/api/farms", headers=headers).json()
    farm_id = farms[0]["id"]

    # Clear any previous lab test to ensure clean baseline for testing
    from app.database import SessionLocal
    from app.models import SoilProfile
    _db = SessionLocal()
    _db.query(SoilProfile).filter(SoilProfile.farm_id == farm_id).delete()
    _db.commit()
    _db.close()

    # 3. Test Soil Analysis (Before lab test: Modelled SoilGrids + Missing NPK warning)
    soil_res = client.get(f"/api/farms/{farm_id}/soil-analysis", headers=headers)
    assert soil_res.status_code == 200
    soil = soil_res.json()
    assert soil["has_lab_test"] is False
    assert "Missing Laboratory Measurements" in soil["npk_status"]["status"]
    assert soil["assessment_completeness_pct"] < 60
    print(f"Verified Soil Baseline: pH {soil['effective_ph']} ({soil['ph_category']}), Missing tests flagged.")

    # 4. Record a Physical Farmer Lab Test
    lab_entry = {
        "ph": 6.1,
        "nitrogen": 285.0,
        "phosphorus": 18.5,
        "potassium": 210.0,
        "organic_carbon": 2.45,
        "texture": "Clay Loam",
        "lab_name": "Krishi Bhavan Soil Lab, Kanjirappally",
    }
    lab_res = client.post(f"/api/farms/{farm_id}/soil", json=lab_entry, headers=headers)
    assert lab_res.status_code == 201

    # 5. Verify Soil Analysis After Lab Test (Completeness increases!)
    soil_after = client.get(f"/api/farms/{farm_id}/soil-analysis", headers=headers).json()
    assert soil_after["has_lab_test"] is True
    assert soil_after["effective_ph"] == 6.1
    assert soil_after["assessment_completeness_pct"] >= 90
    print(f"Verified Lab Test Integration: pH updated to 6.1, completeness {soil_after['assessment_completeness_pct']}%.")

    # 6. Test Terrain Analysis
    terrain_res = client.get(f"/api/farms/{farm_id}/terrain", headers=headers)
    assert terrain_res.status_code == 200
    terrain = terrain_res.json()
    assert "elevation_mean_m" in terrain
    assert "slope_mean_deg" in terrain
    assert "flow_accumulation_risk" in terrain
    print(f"Verified Terrain: Mean Elev {terrain['elevation_mean_m']}m, Slope {terrain['slope_mean_deg']}°, Swale Risk: {terrain['flow_accumulation_risk']}.")

    # 7. Test Crop Knowledge Database
    crops_res = client.get("/api/crops")
    assert crops_res.status_code == 200
    crops = crops_res.json()
    assert len(crops) >= 12
    crop_names = [c["crop_name"] for c in crops]
    assert any("Banana" in n for n in crop_names)
    assert any("Cassava" in n for n in crop_names)
    assert any("Cowpea" in n for n in crop_names)
    print(f"Verified Crop Knowledge Database: {len(crops)} crops loaded.")

    # 8. Test Suitability Scoring Engine
    suit_res = client.post("/api/crops/suitability", json={"farm_id": farm_id}, headers=headers)
    assert suit_res.status_code == 200
    suit_data = suit_res.json()
    assert len(suit_data["crops"]) >= 12
    top_crop = suit_data["crops"][0]
    assert top_crop["suitability_score"] > 0
    assert len(top_crop["supporting_factors"]) > 0
    print(f"Verified Suitability Engine: Top recommended crop for Kanjirappally is '{top_crop['crop_name']}' (Score: {top_crop['suitability_score']}, {top_crop['suitability_class']}).")


if __name__ == "__main__":
    test_soil_terrain_crop_intelligence()
    print("ALL SOIL, TERRAIN & CROP INTELLIGENCE TESTS PASSED SUCCESSFULLY!")

