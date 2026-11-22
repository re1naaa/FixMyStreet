from fastapi.testclient import TestClient

from app import database
from app.models import Category, User, UserRole
from app.utils.security import hash_password
from tests.test_auth import client, register  # noqa: F401


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _setup(client: TestClient) -> tuple[str, str, str, int]:
    citizen = register(client, email="owner@example.com")["access_token"]
    helper = register(client, email="helper@example.com")["access_token"]
    db = database.SessionLocal()
    db.add(Category(name="Trash", slug="trash", description=""))
    db.add(User(email="boss@example.com", password_hash=hash_password("Admin123"), full_name="Boss", role=UserRole.administrator, is_active=True))
    db.commit()
    db.close()
    admin = client.post("/api/auth/login", json={"email": "boss@example.com", "password": "Admin123"}).json()["access_token"]
    category_id = client.get("/api/reports/categories", headers=_auth(citizen)).json()[0]["id"]
    report = client.post(
        "/api/reports",
        headers=_auth(citizen),
        json={"title": "Trash pile", "description": "Trash pile next to the school", "category_id": category_id, "latitude": 42.66, "longitude": 21.16, "urgency": "medium"},
    )
    assert report.status_code == 201, report.text
    return citizen, helper, admin, report.json()["id"]


def test_admin_updates_status_and_removes_report(client: TestClient) -> None:
    citizen, _, admin, report_id = _setup(client)
    forbidden = client.patch(f"/api/admin/reports/{report_id}/status", headers=_auth(citizen), json={"status": "in_progress"})
    assert forbidden.status_code == 403
    updated = client.patch(f"/api/admin/reports/{report_id}/status", headers=_auth(admin), json={"status": "in_progress"})
    assert updated.status_code == 200 and updated.json()["status"] == "in_progress"
    overview = client.get("/api/admin/overview", headers=_auth(admin)).json()
    assert overview["by_status"]["in_progress"] == 1 and overview["total"] == 1
    notes = client.get("/api/reports/notifications", headers=_auth(citizen)).json()
    assert any(item["type"] == "status_change" for item in notes)
    client.post(f"/api/reports/{report_id}/comments", headers=_auth(citizen), json={"body": "Still there"})
    assert client.delete(f"/api/admin/reports/{report_id}", headers=_auth(admin)).status_code == 204
    assert client.get(f"/api/reports/{report_id}", headers=_auth(citizen)).status_code == 404


def test_community_fix_resolves_report(client: TestClient) -> None:
    citizen, helper, _, report_id = _setup(client)
    created = client.post(f"/api/reports/{report_id}/fixes", headers=_auth(helper), json={"body": "I took the trash out", "photo_path": "after.jpg"})
    assert created.status_code == 201, created.text
    assert created.json()["photo_url"] == "/api/uploads/after.jpg"
    report = client.get(f"/api/reports/{report_id}", headers=_auth(citizen)).json()
    assert report["status"] == "resolved" and report["fix_count"] == 1
    fixes = client.get(f"/api/reports/{report_id}/fixes", headers=_auth(citizen)).json()
    assert fixes[0]["author_name"] == "Test Citizen"
    notes = client.get("/api/reports/notifications", headers=_auth(citizen)).json()
    assert any(item["type"] == "community_fix" for item in notes)
