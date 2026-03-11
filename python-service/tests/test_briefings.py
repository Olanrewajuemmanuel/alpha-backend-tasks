import uuid
import pytest
from fastapi.testclient import TestClient


def _correct_payload(**overrides) -> dict:
    """Pass your keyword args to overrirde any field for custom-input tests."""
    base = {
        "companyName": "Acme Holdings",
        "ticker": "ACME",
        "sector": "Industrial Technology",
        "analystName": "Jane Doe",
        "summary": (
            "Acme is benefiting from strong enterprise demand and improving "
            "operating leverage, though customer concentration remains a "
            "near-term risk."
        ),
        "recommendation": (
            "Monitor for margin expansion and customer diversification "
            "before increasing exposure."
        ),
        "keyPoints": [
            "Revenue grew 18% year-over-year in the latest quarter.",
            "Management raised full-year guidance.",
            "Enterprise subscriptions now account for 62% of recurring revenue.",
        ],
        "risks": [
            "Top two customers account for 41% of total revenue.",
            "International expansion may pressure margins over the next two quarters.",
        ],
        "metrics": [
            {"name": "Revenue Growth", "value": "18%"},
            {"name": "Operating Margin", "value": "22.4%"},
            {"name": "P/E Ratio", "value": "28.1x"},
        ],
    }
    base.update(overrides)
    return base


def _create_briefing(client: TestClient, **overrides) -> dict:
    response = client.post("/briefings", json=_correct_payload(**overrides))
    assert response.status_code == 201
    return response.json()


class TestBriefingCreate:
    def test_create_correct_briefing(self, client: TestClient):
        response = client.post("/briefings", json=_correct_payload())
        assert response.status_code == 201

    def test_ticker_normalized_to_uppercase(self, client: TestClient):
        data = _create_briefing(client, ticker="acme")
        assert data["ticker"] == "ACME"

    def test_key_points_stored_in_order(self, client: TestClient):
        data = _create_briefing(client)
        contents = [p["content"] for p in data["key_points"]]
        assert contents[0] == "Revenue grew 18% year-over-year in the latest quarter."
        assert contents[1] == "Management raised full-year guidance."
        assert (
            contents[2]
            == "Enterprise subscriptions now account for 62% of recurring revenue."
        )

    def test_missing_required_field_returns_422(self, client: TestClient):
        payload = _correct_payload()
        del payload["companyName"]
        response = client.post("/briefings", json=payload)
        assert response.status_code == 422

    def test_only_one_key_point_returns_422(self, client: TestClient):
        response = client.post(
            "/briefings/",
            json=_correct_payload(keyPoints=["Only one point."]),
        )
        assert response.status_code == 422

    def test_empty_key_points_list_returns_422(self, client: TestClient):
        response = client.post(
            "/briefings/",
            json=_correct_payload(keyPoints=[]),
        )
        assert response.status_code == 422

    def test_blank_key_point_string_returns_422(self, client: TestClient):
        response = client.post(
            "/briefings/",
            json=_correct_payload(keyPoints=["Valid point.", "   "]),
        )
        assert response.status_code == 422

    def test_empty_risks_list_returns_422(self, client: TestClient):
        response = client.post(
            "/briefings/",
            json=_correct_payload(risks=[]),
        )
        assert response.status_code == 422

    def test_blank_risk_string_returns_422(self, client: TestClient):
        response = client.post(
            "/briefings/",
            json=_correct_payload(risks=["  "]),
        )
        assert response.status_code == 422

    def test_duplicate_metric_names_returns_422(self, client: TestClient):
        response = client.post(
            "/briefings/",
            json=_correct_payload(
                metrics=[
                    {"name": "Revenue Growth", "value": "18%"},
                    {"name": "Revenue Growth", "value": "20%"},
                ]
            ),
        )
        assert response.status_code == 422


class TestBriefingGet:
    def test_retrieve_existing_briefing_returns_200(self, client: TestClient):
        created = _create_briefing(client)
        response = client.get(f"/briefings/{created['id']}")
        assert response.status_code == 200

    def test_is_generated_flag_is_false_for_new_briefing(self, client: TestClient):
        created = _create_briefing(client)
        fetched = client.get(f"/briefings/{created['id']}").json()
        assert fetched.get("is_generated") is False

    def test_get_does_not_expose_rendered_html(self, client: TestClient):
        created = _create_briefing(client)
        fetched = client.get(f"/briefings/{created['id']}").json()
        assert "rendered_html" not in fetched

    def test_unknown_briefing_returns_404(self, client: TestClient):
        fake_id = str(uuid.uuid4())
        response = client.get(f"/briefings/{fake_id}")
        assert response.status_code == 404


class TestBriefingGenerate:

    def test_generate_returns_202(self, client: TestClient):
        created = _create_briefing(client)
        response = client.post(f"/briefings/{created['id']}/generate")
        assert response.status_code == 202

    def test_generate_response_shape(self, client: TestClient):
        created = _create_briefing(client)
        data = client.post(f"/briefings/{created['id']}/generate").json()
        assert "next" in data
        assert "message" in data

    @pytest.mark.skip(reason="Background tasks are suspended in test suite")
    def test_generate_marks_briefing_as_generated(self, client: TestClient):
        created = _create_briefing(client)
        client.post(f"/briefings/{created['id']}/generate")  # TODO: background task!
        fetched = client.get(f"/briefings/{created['id']}").json()
        assert fetched["is_generated"] is True
        assert fetched["generated_at"] is not None


class TestBriefingHtmlGet:

    def test_html_returns_200_after_generate(self, client: TestClient):
        created = _create_briefing(client)
        client.post(f"/briefings/{created['id']}/generate")
        response = client.get(f"/briefings/{created['id']}/html")
        assert response.status_code == 200

    def test_html_content_type_is_html(self, client: TestClient):
        created = _create_briefing(client)
        client.post(f"/briefings/{created['id']}/generate")
        response = client.get(f"/briefings/{created['id']}/html")
        assert "text/html" in response.headers["content-type"]
