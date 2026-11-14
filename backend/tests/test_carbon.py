from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_carbon_credit_module():
    # 1. Login as Thomas (Farmer 1)
    auth1 = client.post("/api/auth/demo-login?farmer_id=1")
    assert auth1.status_code == 200
    token1 = auth1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # 2. Login as Ananya (Farmer 2)
    auth2 = client.post("/api/auth/demo-login?farmer_id=2")
    assert auth2.status_code == 200
    token2 = auth2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 3. Get farms
    farms1 = client.get("/api/farms", headers=headers1).json()
    farm1_id = farms1[0]["id"]

    # 4. Test Candidate Pathways Catalog
    pathways_res = client.get("/api/carbon/pathways")
    assert pathways_res.status_code == 200
    pathways = pathways_res.json()
    assert len(pathways) >= 4
    pathway_ids = [p["id"] for p in pathways]
    assert "agroforestry" in pathway_ids
    assert "rice_methane" in pathway_ids
    assert "soil_carbon" in pathway_ids
    print(f"Verified Carbon Pathways Catalog: {len(pathways)} pathways available ({pathway_ids}).")

    # 5. Test Aggregation Partners Directory
    partners_res = client.get("/api/carbon/partners")
    assert partners_res.status_code == 200
    partners = partners_res.json()
    assert len(partners) >= 3
    print(f"Verified Carbon Partners Directory: {len(partners)} aggregators/developers listed.")

    # 6. Test Farm Eligibility Screening for Agroforestry
    screen_payload = {
        "farm_id": farm1_id,
        "pathway": "agroforestry",
        "tree_density_per_acre": 55,
        "practices_mulching_or_cover_crops": True,
    }
    elig_res = client.post("/api/carbon/eligibility", json=screen_payload, headers=headers1)
    assert elig_res.status_code == 200, elig_res.text
    elig = elig_res.json()
    assert elig["pathway"] == "agroforestry"
    assert elig["status"] in ["eligible", "conditionally_eligible"]
    assert elig["readiness_score"] > 50.0
    print(f"Verified Eligibility Screening: Status '{elig['status']}' with Readiness Score {elig['readiness_score']}%.")

    # 7. Test Indicative Yield & Net Revenue Estimate
    est_res = client.get(
        f"/api/farms/{farm1_id}/carbon/estimate?pathway=agroforestry&carbon_price_usd=18.0&developer_commission_pct=30.0",
        headers=headers1,
    )
    assert est_res.status_code == 200, est_res.text
    est = est_res.json()
    assert est["conservative_tco2e_yr"] > 0
    assert est["expected_tco2e_yr"] > est["conservative_tco2e_yr"]
    assert est["high_tco2e_yr"] > est["expected_tco2e_yr"]
    assert "net_farmer_inr_range" in est
    assert est["net_farmer_inr_range"]["expected"] > 0
    assert len(est["disclaimer"]) > 50
    print(
        f"Verified Carbon Yield Estimate: {est['conservative_tco2e_yr']} to {est['high_tco2e_yr']} tCO2e/yr, "
        f"Projected Net INR: ₹{est['net_farmer_inr_range']['low']:,.0f} - ₹{est['net_farmer_inr_range']['high']:,.0f}."
    )

    # 8. Record an Evidence Item
    evidence_payload = {
        "pathway": "agroforestry",
        "evidence_type": "tree_inventory_log",
        "title": "Block A Robusta Banana & Gliricidia Tree Count",
        "description": "55 stems per acre verified across Kanjirappally Block A terrace",
        "metadata_json": {"stems_per_acre": 55, "species": ["Gliricidia sepium", "Musa acuminata"]},
    }
    evidence_res = client.post(f"/api/farms/{farm1_id}/carbon/evidence", json=evidence_payload, headers=headers1)
    assert evidence_res.status_code == 201
    ev_item = evidence_res.json()
    assert ev_item["title"] == evidence_payload["title"]
    print(f"Verified Evidence Logging: Recorded evidence item '{ev_item['title']}'.")

    # 9. List Farm Evidence Items
    ev_list_res = client.get(f"/api/farms/{farm1_id}/carbon/evidence", headers=headers1)
    assert ev_list_res.status_code == 200
    ev_list = ev_list_res.json()
    assert len(ev_list) >= 1
    print(f"Verified Evidence Listing: {len(ev_list)} evidence item(s) on file.")

    # 10. Generate Complete Aggregation Dossier
    dossier_res = client.get(f"/api/farms/{farm1_id}/carbon/dossier", headers=headers1)
    assert dossier_res.status_code == 200, dossier_res.text
    dossier = dossier_res.json()
    assert "markdown_pack" in dossier
    assert "eligibility_summary" in dossier
    assert len(dossier["markdown_pack"]) > 200
    print(f"Verified Carbon Aggregation Pack: Generated {len(dossier['markdown_pack'])} chars dossier.")

    # 11. Test Multi-Tenant Security: Farmer 2 cannot access Farmer 1's carbon estimate or dossier
    forbidden_est = client.get(f"/api/farms/{farm1_id}/carbon/estimate", headers=headers2)
    assert forbidden_est.status_code == 403
    forbidden_dossier = client.get(f"/api/farms/{farm1_id}/carbon/dossier", headers=headers2)
    assert forbidden_dossier.status_code == 403
    print("Verified Multi-Tenant Security: HTTP 403 on cross-tenant carbon queries.")


if __name__ == "__main__":
    test_carbon_credit_module()
    print("ALL CARBON CREDIT MODULE TESTS PASSED SUCCESSFULLY!")
