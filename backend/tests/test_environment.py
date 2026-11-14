from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_earth_observation_endpoints():
    # 1. Login as Thomas (Kanjirappally Farm)
    login_res = client.post("/api/auth/demo-login?farmer_id=1")
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get registered farms
    farms_res = client.get("/api/farms", headers=headers)
    assert farms_res.status_code == 200
    farms = farms_res.json()
    assert len(farms) > 0
    farm_id = farms[0]["id"]

    # 3. Test Data Sources Registry
    ds_res = client.get("/api/data-sources")
    assert ds_res.status_code == 200
    sources = ds_res.json()
    assert len(sources) >= 4
    names = [s["dataset_name"] for s in sources]
    assert any("GPM" in n for n in names)
    assert any("SMAP" in n for n in names)
    assert any("POWER" in n for n in names)
    print(f"Verified Data Sources Registry ({len(sources)} datasets).")

    # 4. Test Rainfall Endpoint
    rain_res = client.get(f"/api/farms/{farm_id}/rainfall", headers=headers)
    assert rain_res.status_code == 200, rain_res.text
    rain_data = rain_res.json()
    assert "timeseries" in rain_data
    assert len(rain_data["timeseries"]) > 0
    assert "cumulative_rainfall_mm" in rain_data
    print(f"Verified GPM Rainfall: {rain_data['cumulative_rainfall_mm']} mm cumulative across {len(rain_data['timeseries'])} days.")

    # 5. Test Vegetation Endpoint (NDVI / NDMI)
    veg_res = client.get(f"/api/farms/{farm_id}/vegetation", headers=headers)
    assert veg_res.status_code == 200, veg_res.text
    veg_data = veg_res.json()
    assert "observations" in veg_data
    assert len(veg_data["observations"]) > 0
    assert "latest_ndvi" in veg_data
    assert "canopy_status" in veg_data
    print(f"Verified Vegetation: Latest NDVI {veg_data['latest_ndvi']} ({veg_data['canopy_status']['vigor_status']}).")

    # 6. Test SMAP Soil Moisture Endpoint
    smap_res = client.get(f"/api/farms/{farm_id}/soil-moisture", headers=headers)
    assert smap_res.status_code == 200
    smap_data = smap_res.json()
    assert "surface_soil_moisture_m3m3" in smap_data
    assert "scientific_limitation" in smap_data
    print(f"Verified SMAP: Surface Soil Moisture {smap_data['surface_soil_moisture_m3m3']} m3/m3.")

    # 7. Test Environment Summary
    env_res = client.get(f"/api/farms/{farm_id}/environment", headers=headers)
    assert env_res.status_code == 200
    env_data = env_res.json()
    assert "summary" in env_data
    assert "weather_timeseries" in env_data
    assert "vegetation_timeseries" in env_data
    print(f"Verified Complete Environment Profile: Avg Temp {env_data['summary']['avg_temperature_c']}°C.")


if __name__ == "__main__":
    test_earth_observation_endpoints()
    print("ALL EARTH OBSERVATION TESTS PASSED SUCCESSFULLY!")

