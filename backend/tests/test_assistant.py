from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_ai_farm_assistant():
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

    # 3. Get farms for Farmer 1
    farms = client.get("/api/farms", headers=headers1).json()
    farm_id = farms[0]["id"]

    # 4. Verify Suggested Prompts Endpoint
    prompts_res = client.get(f"/api/assistant/prompts/{farm_id}", headers=headers1)
    assert prompts_res.status_code == 200
    prompts = prompts_res.json()
    assert len(prompts) >= 4
    assert any("suitability" in p["prompt"].lower() or "crop" in p["prompt"].lower() for p in prompts)
    print(f"Verified Suggested Prompts: {len(prompts)} prompts returned.")

    # 5. Test Chat with Soil Query
    soil_payload = {
        "farm_id": farm_id,
        "message": "My soil seems acidic. What does FieldShift recommend?",
    }
    chat_res = client.post("/api/assistant/chat", json=soil_payload, headers=headers1)
    assert chat_res.status_code == 200, chat_res.text
    chat_data = chat_res.json()
    assert "reply" in chat_data
    assert "tools_executed" in chat_data
    tool_names = [t["tool_name"] for t in chat_data["tools_executed"]]
    assert "get_soil_analysis" in tool_names or "get_farm_digital_twin" in tool_names
    assert len(chat_data["citations"]) > 0
    session_id = chat_data["session_id"]
    print(f"Verified Soil Chat Advisory: Tool calls {tool_names}, Reply length {len(chat_data['reply'])} chars.")

    # 6. Test Follow-up Chat with Crop Recommendation Query in Same Session
    crop_payload = {
        "farm_id": farm_id,
        "message": "What crop should I plant next based on current rainfall and soil?",
        "session_id": session_id,
    }
    chat_res2 = client.post("/api/assistant/chat", json=crop_payload, headers=headers1)
    assert chat_res2.status_code == 200
    chat_data2 = chat_res2.json()
    assert chat_data2["session_id"] == session_id
    tool_names2 = [t["tool_name"] for t in chat_data2["tools_executed"]]
    assert "evaluate_crop_suitability" in tool_names2
    print(f"Verified Crop Recommendation Tool Calling: {tool_names2}.")

    # 7. Test Multi-tenant Isolation: Farmer 2 cannot chat with Farmer 1's farm
    forbidden_payload = {
        "farm_id": farm_id,
        "message": "Show me this farm data",
    }
    forbidden_res = client.post("/api/assistant/chat", json=forbidden_payload, headers=headers2)
    assert forbidden_res.status_code == 403
    print("Verified Multi-Tenant Security: Unauthorized user rejected with HTTP 403.")

    # 8. Test History Persistence
    hist_res = client.get(f"/api/assistant/history/{farm_id}", headers=headers1)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) >= 4  # At least 2 user messages + 2 assistant replies
    print(f"Verified Chat History: {len(history)} messages recorded in database.")


if __name__ == "__main__":
    test_ai_farm_assistant()
    print("ALL AI ASSISTANT TESTS PASSED SUCCESSFULLY!")
