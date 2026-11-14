from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_rotation_and_digital_twin():
    # 1. Login as Thomas (Kanjirappally Farm)
    auth = client.post("/api/auth/demo-login?farmer_id=1")
    assert auth.status_code == 200
    token = auth.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    farms = client.get("/api/farms", headers=headers).json()
    farm_id = farms[0]["id"]

    # 2. Test Crop Rotation Optimization
    rot_res = client.get(f"/api/farms/{farm_id}/rotation", headers=headers)
    assert rot_res.status_code == 200
    rot_data = rot_res.json()
    assert rot_data["strategies_count"] == 3
    strategies = rot_data["strategies"]
    names = [s["strategy"] for s in strategies]
    assert "soil_health" in names
    assert "water_efficiency" in names
    assert "balanced" in names
    # Verify multi-year timeline
    assert len(strategies[0]["steps"]) == 3
    print(f"Verified Crop Rotation Planner: 3 strategies generated (Strategy A Score: {strategies[0]['overall_score']}).")

    # 3. Test Digital Twin Generation
    twin_res = client.get(f"/api/farms/{farm_id}/digital-twin", headers=headers)
    assert twin_res.status_code == 200
    twin = twin_res.json()
    assert "crop_state" in twin
    assert "soil_state" in twin
    assert "terrain_state" in twin
    assert "environmental_state" in twin
    assert "risk_assessment" in twin
    assert "data_completeness_pct" in twin
    print(f"Verified Digital Twin: Risk Score {twin['risk_assessment']['overall_risk_score']} ({twin['risk_assessment']['risk_level']}), Completeness: {twin['data_completeness_pct']}%.")

    # 4. Test What-If Simulation Engine
    sim_payload = {
        "crop_name": "Cassava / Tapioca",
        "rainfall_delta_pct": -35.0,  # 35% drought
        "irrigation_available": False,  # Rainfed
        "planting_delay_days": 15,
    }
    sim_res = client.post(f"/api/farms/{farm_id}/digital-twin/simulate", json=sim_payload, headers=headers)
    assert sim_res.status_code == 200, sim_res.text
    sim = sim_res.json()
    assert "recalculated_suitability" in sim
    assert "projected_risk_score" in sim
    assert len(sim["consequences"]) > 0
    print(f"Verified What-If Simulator: Scenario Risk {sim['projected_risk_score']} ({sim['projected_risk_level']}), Recalculated Suitability for Cassava: {sim['recalculated_suitability']['score']}.")

    # 5. Test Digital Twin Snapshot History
    hist_res = client.get(f"/api/farms/{farm_id}/digital-twin/history", headers=headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) > 0
    print(f"Verified Snapshot History: {len(history)} recorded snapshot(s).")


if __name__ == "__main__":
    test_rotation_and_digital_twin()
    print("ALL ROTATION & DIGITAL TWIN TESTS PASSED SUCCESSFULLY!")

