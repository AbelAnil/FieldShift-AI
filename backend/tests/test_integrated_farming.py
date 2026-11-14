from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_integrated_farming_system_module():
    # 1. Login as Farmer 1 (Thomas)
    auth1 = client.post("/api/auth/demo-login?farmer_id=1")
    assert auth1.status_code == 200
    token1 = auth1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # 2. Login as Farmer 2 (Ananya)
    auth2 = client.post("/api/auth/demo-login?farmer_id=2")
    assert auth2.status_code == 200
    token2 = auth2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 3. Retrieve Farmer 1's farms
    farms1 = client.get("/api/farms", headers=headers1).json()
    farm1_id = farms1[0]["id"]

    # 4. Test GET /api/integrated-farming/{farm_id} - Full Overview
    overview_res = client.get(f"/api/integrated-farming/{farm1_id}", headers=headers1)
    assert overview_res.status_code == 200, overview_res.text
    overview = overview_res.json()

    assert overview["farm_id"] == farm1_id
    assert len(overview["livestock"]) >= 1
    assert len(overview["ponds"]) >= 1
    assert len(overview["apiculture"]) >= 1
    assert "thi_status" in overview
    assert "rainwater_telemetry" in overview
    assert "pollination_telemetry" in overview
    assert "nutrient_balance" in overview

    # 5. Test Live Cattle THI heat stress telemetry
    thi_res = client.get(f"/api/integrated-farming/{farm1_id}/thi-telemetry", headers=headers1)
    assert thi_res.status_code == 200, thi_res.text
    thi = thi_res.json()
    assert "thi_value" in thi
    assert "stress_level" in thi
    assert "recommended_interventions" in thi
    assert len(thi["recommended_interventions"]) > 0

    # 6. Test Rainwater Pond Sizer telemetry
    pond_res = client.get(f"/api/integrated-farming/{farm1_id}/rainwater-pond", headers=headers1)
    assert pond_res.status_code == 200, pond_res.text
    pond = pond_res.json()
    assert pond["harvestable_runoff_m3"] > 0
    assert pond["harvestable_runoff_litres"] > 0
    assert pond["pond_capacity_m3"] > 0
    assert len(pond["species_mix"]) >= 3

    # 7. Test Apiculture Pollination telemetry
    poll_res = client.get(f"/api/integrated-farming/{farm1_id}/pollination-impact", headers=headers1)
    assert poll_res.status_code == 200, poll_res.text
    poll = poll_res.json()
    assert poll["projected_yield_increase_pct"] > 0
    assert poll["annual_honey_gross_revenue_inr"] > 0

    # 8. Test Nutrient Bio-Resource Balance
    nutr_res = client.get(f"/api/integrated-farming/{farm1_id}/nutrient-balance", headers=headers1)
    assert nutr_res.status_code == 200, nutr_res.text
    nutr = nutr_res.json()
    assert nutr["total_fym_produced_tons_year"] > 0
    assert nutr["nitrogen_n_displaced_kg"] > 0
    assert nutr["synthetic_fertilizer_cost_saved_inr"] > 0
    assert len(nutr["circular_loops"]) >= 4

    # 9. Test POST /api/integrated-farming/{farm_id}/livestock
    new_livestock = {
        "animal_type": "duck",
        "breed_name": "Kuttanad Chara Duck",
        "unit_count": 20,
        "daily_yield_metric": "18 eggs/day",
        "daily_manure_kg_total": 3.0,
        "biogas_linked": False,
        "notes": "Paddy biological pest control & deep-litter manure",
    }
    create_res = client.post(
        f"/api/integrated-farming/{farm1_id}/livestock",
        json=new_livestock,
        headers=headers1,
    )
    assert create_res.status_code == 200, create_res.text
    created = create_res.json()
    assert created["breed_name"] == "Kuttanad Chara Duck"
    assert created["unit_count"] == 20

    # 10. Test Authorization: Farmer 2 cannot access Farmer 1's IFS data
    forbidden_res = client.get(f"/api/integrated-farming/{farm1_id}", headers=headers2)
    assert forbidden_res.status_code == 403
