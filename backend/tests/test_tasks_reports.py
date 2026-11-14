from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_tasks_and_reports():
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

    # 4. Sync Telemetry Tasks for Farm 1
    tasks_res = client.get(f"/api/farms/{farm1_id}/tasks?sync_telemetry=true", headers=headers1)
    assert tasks_res.status_code == 200, tasks_res.text
    tasks = tasks_res.json()
    assert len(tasks) >= 2
    task_titles = [t["title"] for t in tasks]
    print(f"Verified Condition-Based Tasks: Generated {len(tasks)} tasks: {task_titles[:3]}.")

    # 5. Create a Custom Farmer Task
    custom_task = {
        "title": "Mend southern terrace bund before monsoon",
        "description": "Stone reinforcement along block B perimeter",
        "category": "drainage",
        "priority": "high",
        "due_date": "2026-12-01",
        "trigger_source": "Farmer Manual Entry",
    }
    create_res = client.post(f"/api/farms/{farm1_id}/tasks", json=custom_task, headers=headers1)
    assert create_res.status_code == 201
    created = create_res.json()
    task_id = created["id"]
    assert created["title"] == custom_task["title"]
    assert created["status"] == "pending"
    print(f"Verified Custom Task Creation: ID {task_id}.")

    # 6. Update Task Status to 'completed'
    update_res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "completed"}, headers=headers1)
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["status"] == "completed"
    assert updated["completed_at"] is not None
    print(f"Verified Task Status Update: Status is '{updated['status']}'.")

    # 7. Test Multi-tenant Security: Farmer 2 cannot update Farmer 1's task
    forbidden_update = client.patch(f"/api/tasks/{task_id}/status", json={"status": "pending"}, headers=headers2)
    assert forbidden_update.status_code == 403
    print("Verified Multi-Tenant Security on Tasks: HTTP 403 on cross-tenant access.")

    # 8. Test Farm Intelligence Dossier Report Generation
    report_res = client.get(f"/api/farms/{farm1_id}/report", headers=headers1)
    assert report_res.status_code == 200, report_res.text
    report = report_res.json()
    assert "markdown_report" in report
    assert "summary_kpis" in report
    assert "top_crops" in report
    assert "rotation_strategies" in report
    assert len(report["top_crops"]) > 0
    kpis = report["summary_kpis"]
    print(f"Verified Dossier Report: Top Crop {kpis['top_crop']} (Score: {kpis['top_crop_score']:.1f}), Risk Score {kpis['risk_score']}.")

    # 9. Verify Multi-tenant on Reports: Farmer 2 cannot view Farmer 1's report
    forbidden_report = client.get(f"/api/farms/{farm1_id}/report", headers=headers2)
    assert forbidden_report.status_code == 403
    print("Verified Multi-Tenant Security on Reports: HTTP 403 on cross-tenant access.")

    # 10. Delete Custom Task
    del_res = client.delete(f"/api/tasks/{task_id}", headers=headers1)
    assert del_res.status_code == 204
    print("Verified Task Deletion.")


if __name__ == "__main__":
    test_tasks_and_reports()
    print("ALL TASKS & REPORTS TESTS PASSED SUCCESSFULLY!")
