import sys
from pathlib import Path

# Ensure `src` is on sys.path so we can import `app`
sys.path.append(str(Path(__file__).resolve().parents[1] / "src"))

from fastapi.testclient import TestClient
import pytest

from app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_remove_participant():
    activity_name = "Chess Club"
    email = "teststudent@example.com"

    # Ensure clean state
    if email in activities[activity_name]["participants"]:
        activities[activity_name]["participants"].remove(email)

    # Sign up
    resp = client.post(f"/activities/{activity_name}/signup", params={"email": email})
    assert resp.status_code == 200
    assert email in activities[activity_name]["participants"]

    # Confirm via GET
    resp2 = client.get("/activities")
    assert resp2.status_code == 200
    assert email in resp2.json()[activity_name]["participants"]

    # Remove participant
    resp3 = client.delete(f"/activities/{activity_name}/participants", params={"email": email})
    assert resp3.status_code == 200
    assert email not in activities[activity_name]["participants"]
