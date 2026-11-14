from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_auth_and_farm_isolation():
    # 1. Login as Thomas (Farmer 1)
    res = client.post("/api/auth/demo-login?farmer_id=1")
    assert res.status_code == 200, res.text
    token1 = res.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # 2. Login as Ananya (Farmer 2)
    res = client.post("/api/auth/demo-login?farmer_id=2")
    assert res.status_code == 200
    token2 = res.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 3. List farms for Farmer 1
    res1 = client.get("/api/farms", headers=headers1)
    assert res1.status_code == 200
    farms1 = res1.json()
    assert len(farms1) >= 1
    farm1_id = farms1[0]["id"]
    assert "Kanjirappally" in farms1[0]["farm_name"]

    # 4. List farms for Farmer 2
    res2 = client.get("/api/farms", headers=headers2)
    assert res2.status_code == 200
    farms2 = res2.json()
    assert len(farms2) >= 1
    farm2_id = farms2[0]["id"]
    assert "Wayanad" in farms2[0]["farm_name"]

    # 5. Verify Isolation: Farmer 1 cannot read Farmer 2's farm
    forbidden_res = client.get(f"/api/farms/{farm2_id}", headers=headers1)
    assert forbidden_res.status_code == 403, "Farmer 1 was able to access Farmer 2's farm!"

    # 6. Verify Isolation: Farmer 2 cannot read Farmer 1's farm
    forbidden_res2 = client.get(f"/api/farms/{farm1_id}", headers=headers2)
    assert forbidden_res2.status_code == 403, "Farmer 2 was able to access Farmer 1's farm!"

    # 7. Test GeoJSON validation endpoint
    test_poly = {
        "geojson": {
            "type": "Polygon",
            "coordinates": [
                [
                    [76.78, 9.55],
                    [76.79, 9.55],
                    [76.79, 9.56],
                    [76.78, 9.56],
                    [76.78, 9.55],
                ]
            ],
        }
    }
    val_res = client.post("/api/fields/validate-geojson", json=test_poly)
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["is_valid"] is True
    assert val_data["area_hectares"] > 0
    assert val_data["area_acres"] > 0
    print(f"Validation successful! Area: {val_data['area_hectares']} ha ({val_data['area_acres']} acres)")


if __name__ == "__main__":
    test_auth_and_farm_isolation()
    print("ALL AUTH & FARM TESTS PASSED SUCCESSFULLY!")
