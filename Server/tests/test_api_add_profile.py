import importlib
import os
import tempfile
import unittest
import sys
from pathlib import Path
from unittest.mock import patch

from sqlalchemy import create_engine


class AddProfileResilienceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        cls.db_file.close()
        os.environ["DATABASE_URL"] = f"sqlite:///{cls.db_file.name}"

        server_root = Path(__file__).resolve().parents[1]
        if str(server_root) not in sys.path:
            sys.path.insert(0, str(server_root))

        import backend as backend  # pylint: disable=import-outside-toplevel

        cls.backend = importlib.reload(backend)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.db_file.name):
            os.remove(cls.db_file.name)

    def setUp(self):
        test_engine = create_engine(f"sqlite:///{self.db_file.name}", future=True, echo=False)
        self.backend.engine = test_engine
        self.backend.Base.metadata.drop_all(test_engine)
        self.backend.Base.metadata.create_all(test_engine)
        self.backend.portfolio_history_cache.clear()
        self.client = self.backend.stockboard.test_client()

    def test_add_profile_creates_user_even_when_quote_lookup_fails(self):
        payload = {
            "user": "alice",
            "stocks": [
                {"ticker": "AAPL", "broker": "Fidelity", "shares": 3},
            ],
        }

        with patch.object(self.backend, "latest_price", side_effect=RuntimeError("provider timeout")), \
            patch.object(self.backend, "price_snapshot", return_value=(100.0, 99.0)):
            response = self.client.post("/api/add-profile", json=payload)

        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertEqual(data["user"], "alice")
        self.assertIn("stocks", data)
        self.assertIn("portfolio_total", data)
        self.assertEqual(len(data["stocks"]), 1)
        self.assertEqual(data["stocks"][0]["ticker"], "AAPL")
        self.assertEqual(data["stocks"][0]["broker"], "Fidelity")
        self.assertEqual(data["stocks"][0]["shares"], 3.0)


if __name__ == "__main__":
    unittest.main()
