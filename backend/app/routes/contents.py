from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.content_service import get_content_by_topic_id, upsert_content

contents_bp = Blueprint("contents", __name__)


@contents_bp.route("/api/topics/<int:topic_id>/content", methods=["GET"])
@jwt_required()
def get_content(topic_id):
    user_id = get_jwt_identity()
    content = get_content_by_topic_id(topic_id, user_id)
    if not content:
        return jsonify({"error": "Not found"}), 404
    return jsonify(content.to_dict())


@contents_bp.route("/api/topics/<int:topic_id>/content", methods=["PUT"])
@jwt_required()
def save_content(topic_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    body = data.get("body", "")
    content_type = data.get("content_type", "markdown")
    content = upsert_content(topic_id, user_id, body, content_type)
    if not content:
        return jsonify({"error": "Topic not found"}), 404
    return jsonify(content.to_dict())
