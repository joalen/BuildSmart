import uuid
from datetime import datetime, timezone


def fresh_sku():
    return f"TEST-SKU-{uuid.uuid4().hex[:8]}"


def seed_events(client, sku, project_type, n, quantity=2):
    for _ in range(n):
        r = client.post("/events/sku", json={
            "session_id": str(uuid.uuid4()),
            "project_type": project_type,
            "sku": sku,
            "quantity": quantity,
        })
        assert r.status_code == 200, r.text


def aggregate(client):
    r = client.post("/admin/aggregate")
    assert r.status_code == 200, r.text


def get_aggregates(client):
    r = client.get("/admin/aggregates")
    assert r.status_code == 200, r.text
    return r.json()


def find_sku(client, sku):
    return next((r for r in get_aggregates(client) if r["sku"] == sku), None)


def test_sku_appears_after_aggregation(client):
    sku = fresh_sku()
    seed_events(client, sku=sku, project_type="bathroom_remodel", n=3)
    aggregate(client)
    assert find_sku(client, sku) is not None


def test_frequency_is_distinct_session_count(client):
    sku = fresh_sku()
    seed_events(client, sku=sku, project_type="deck_build", n=5)
    aggregate(client)
    assert find_sku(client, sku)["frequency"] == 5


def test_total_quantity_is_sum(client):
    sku = fresh_sku()
    seed_events(client, sku=sku, project_type="kitchen_reno", n=4, quantity=2)
    aggregate(client)
    assert find_sku(client, sku)["total_quantity"] == 8


def test_no_pii_in_aggregate_rows(client):
    PII_FIELDS = {"name", "email", "address", "phone", "user_id", "ip", "session_id"}
    sku = fresh_sku()
    seed_events(client, sku=sku, project_type="fence", n=1)
    aggregate(client)
    for row in get_aggregates(client):
        assert not (PII_FIELDS & set(row.keys()))


def test_required_fields_present(client):
    REQUIRED = {"date", "sku", "project_type", "frequency", "total_quantity"}
    sku = fresh_sku()
    seed_events(client, sku=sku, project_type="flooring", n=1)
    aggregate(client)
    assert REQUIRED.issubset(set(find_sku(client, sku).keys()))


def test_date_is_today(client):
    sku = fresh_sku()
    seed_events(client, sku=sku, project_type="roofing", n=1)
    aggregate(client)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    assert find_sku(client, sku)["date"] == today


def test_aggregation_is_idempotent(client):
    sku = fresh_sku()
    seed_events(client, sku=sku, project_type="painting", n=3)
    aggregate(client)
    aggregate(client)
    matches = [r for r in get_aggregates(client) if r["sku"] == sku]
    assert len(matches) == 1
    assert matches[0]["frequency"] == 3