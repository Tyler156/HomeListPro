from functools import wraps

from flask import g, jsonify, request
from firebase_admin import auth as fb_auth


def require_auth(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"error": "missing_bearer_token"}), 401

        token = header[len("Bearer "):].strip()
        try:
            decoded = fb_auth.verify_id_token(token)
        except fb_auth.ExpiredIdTokenError:
            return jsonify({"error": "expired_token"}), 401
        except fb_auth.InvalidIdTokenError:
            return jsonify({"error": "invalid_token"}), 401
        except Exception:
            return jsonify({"error": "auth_failed"}), 401

        g.user = decoded
        return view(*args, **kwargs)

    return wrapper
