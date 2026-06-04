import os

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import credentials
from flask import Flask, g, jsonify
from flask_cors import CORS

from auth import require_auth

load_dotenv()

SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT", "./serviceAccountKey.json")
DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:8000")

if not os.path.exists(SERVICE_ACCOUNT_PATH):
    raise SystemExit(
        f"Firebase service account not found at {SERVICE_ACCOUNT_PATH}. "
        "Download it from Firebase Console → Project settings → Service accounts."
    )

firebase_admin.initialize_app(
    credentials.Certificate(SERVICE_ACCOUNT_PATH),
    {"databaseURL": DATABASE_URL} if DATABASE_URL else None,
)

app = Flask(__name__)
CORS(app, origins=[FRONTEND_ORIGIN])


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/me")
@require_auth
def me():
    return jsonify({"uid": g.user["uid"], "email": g.user.get("email")})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
