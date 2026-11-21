import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.database import SessionLocal
from app.models import Neighborhood, User, UserRole
from app.utils.security import hash_password


@pytest.fixture
def client(tmp_path, monkeypatch):
    database_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{database_path.as_posix()}")
    monkeypatch.setenv("JWT_SECRET", "test-secret-key-0123456789")
    monkeypatch.setenv("SEED_DEMO_DATA", "false")
    monkeypatch.setenv("ENVIRONMENT", "development")

    get_settings.cache_clear()
    from app.database import reset_database

    reset_database()
    from app.main import create_app

    application = create_app()
    with TestClient(application) as test_client:
        yield test_client
    reset_database()
    get_settings.cache_clear()


def register(client: TestClient, email: str = "citizen@example.com", **extra) -> dict:
    payload = {
        "email": email,
        "password": "Citizen123",
        "full_name": "Test Citizen",
        **extra,
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_schema_contains_required_tables(client: TestClient) -> None:
    from sqlalchemy import inspect

    from app.database import get_engine

    names = set(inspect(get_engine()).get_table_names())
    assert {
        "users",
        "reports",
        "categories",
        "comments",
        "votes",
        "notifications",
        "report_status_history",
        "worker_assignments",
        "achievements",
        "user_achievements",
        "neighborhoods",
        "internal_notes",
    } <= names


def test_register_login_and_profile(client: TestClient) -> None:
    created = register(client)
    assert created["user"]["role"] == "citizen"
    assert created["user"]["points"] == 0
    assert created["token_type"] == "bearer"
    assert created["user"]["email"] == "citizen@example.com"

    db = SessionLocal()
    try:
        stored = db.query(User).filter(User.email == "citizen@example.com").one()
        assert stored.password_hash != "Citizen123"
        assert stored.password_hash.startswith("$2")
    finally:
        db.close()

    login = client.post("/api/auth/login", json={"email": "Citizen@Example.com", "password": "Citizen123"})
    assert login.status_code == 200
    token = login.json()["access_token"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["full_name"] == "Test Citizen"

    neighborhood = client.post(
        "/api/auth/register",
        json={"email": "other@example.com", "password": "Citizen123", "full_name": "Other Person"},
    )
    assert neighborhood.status_code == 201

    db = SessionLocal()
    try:
        area = Neighborhood(name="Test Quarter", slug="test-quarter", description="Used by tests")
        db.add(area)
        db.commit()
        area_id = area.id
    finally:
        db.close()

    updated = client.patch(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": "Updated Citizen", "neighborhood_id": area_id},
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["full_name"] == "Updated Citizen"
    assert body["neighborhood_name"] == "Test Quarter"


def test_register_cannot_choose_administrator_role(client: TestClient) -> None:
    created = register(client, email="sneaky@example.com", role="administrator")
    assert created["user"]["role"] == "citizen"
    token = created["access_token"]
    denied = client.get("/api/admin/access", headers={"Authorization": f"Bearer {token}"})
    assert denied.status_code == 403


def test_duplicate_email_and_bad_password(client: TestClient) -> None:
    register(client, email="dup@example.com")
    duplicate = client.post(
        "/api/auth/register",
        json={"email": "dup@example.com", "password": "Citizen123", "full_name": "Dup User"},
    )
    assert duplicate.status_code == 409

    weak = client.post(
        "/api/auth/register",
        json={"email": "weak@example.com", "password": "password", "full_name": "Weak User"},
    )
    assert weak.status_code == 422

    bad_login = client.post("/api/auth/login", json={"email": "dup@example.com", "password": "Wrongpass1"})
    assert bad_login.status_code == 401
    missing = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "Citizen123"})
    assert missing.status_code == 401
    assert bad_login.json()["detail"] == missing.json()["detail"]


def test_authentication_required_and_role_is_loaded_from_database(client: TestClient) -> None:
    anonymous = client.get("/api/auth/me")
    assert anonymous.status_code == 401

    created = register(client, email="role-check@example.com")
    settings = get_settings()
    forged = jwt.encode(
        {"sub": str(created["user"]["id"]), "role": "administrator", "exp": 9999999999},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    denied = client.get("/api/admin/access", headers={"Authorization": f"Bearer {forged}"})
    assert denied.status_code == 403

    db = SessionLocal()
    try:
        admin = User(
            email="admin@example.com",
            password_hash=hash_password("Adminpass1"),
            full_name="Admin User",
            role=UserRole.administrator,
            points=0,
            is_active=True,
        )
        db.add(admin)
        db.commit()
    finally:
        db.close()

    login = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "Adminpass1"})
    assert login.status_code == 200
    allowed = client.get(
        "/api/admin/access",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    assert allowed.status_code == 200
    assert allowed.json()["role"] == "administrator"


def test_foreign_key_rejects_unknown_neighborhood(client: TestClient) -> None:
    missing = client.post(
        "/api/auth/register",
        json={
            "email": "area@example.com",
            "password": "Citizen123",
            "full_name": "Area User",
            "neighborhood_id": 99999,
        },
    )
    assert missing.status_code == 404

    db = SessionLocal()
    try:
        db.add(
            User(
                email="orphan@example.com",
                password_hash=hash_password("Citizen123"),
                full_name="Orphan User",
                role=UserRole.citizen,
                neighborhood_id=424242,
                points=0,
                is_active=True,
            )
        )
        with pytest.raises(IntegrityError):
            db.commit()
    finally:
        db.rollback()
        db.close()
