import requests
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.services.user_service import get_or_create_user, get_user

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/sync", methods=["POST"])
def sync_user():
    data = request.get_json()
    supabase_token = data.get("access_token")
    if not supabase_token:
        return jsonify({"error": "access_token required"}), 400

    supabase_url = current_app.config.get("SUPABASE_URL")
    supabase_key = current_app.config.get("SUPABASE_SERVICE_KEY")

    resp = requests.get(
        f"{supabase_url}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {supabase_token}",
            "apikey": supabase_key,
        },
    )
    if resp.status_code != 200:
        return jsonify({"error": "Invalid token"}), 401

    user_data = resp.json()
    user = get_or_create_user(
        user_id=user_data["id"],
        email=user_data.get("email", ""),
        display_name=user_data.get("user_metadata", {}).get("full_name")
        or user_data.get("user_metadata", {}).get("name"),
        avatar_url=user_data.get("user_metadata", {}).get("avatar_url"),
    )

    access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": access_token, "user": user.to_dict()})


@auth_bp.route("/api/auth/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = get_user(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict())
