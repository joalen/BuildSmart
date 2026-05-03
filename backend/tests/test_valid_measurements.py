def test_generate_plan_with_dimensions(client):
    response = client.post("/generate-plan", json={
        "input": "Retile my 12 x 9.5 ft bathroom floor with ceramic tiles"
    })
    assert response.status_code == 200
    plan = response.json()

    assert "materials" in plan
    assert "steps" in plan
    assert len(plan["materials"]) > 0

    tile = next((m for m in plan["materials"] if "tile" in m["name"].lower()), None)
    assert tile is not None
    assert float(tile["quantity"]) > 0