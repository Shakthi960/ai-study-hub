from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.topic_service import (
    get_topics_for_chapter,
    create_topic,
    update_topic,
    delete_topic,
    reorder_topics,
)
from app.services.content_service import get_content_by_topic_id

topics_bp = Blueprint("topics", __name__)


@topics_bp.route("/api/chapters/<int:chapter_id>/topics", methods=["GET"])
@jwt_required()
def list_topics(chapter_id):
    user_id = get_jwt_identity()
    topics = get_topics_for_chapter(chapter_id, user_id)
    if topics is None:
        return jsonify({"error": "Chapter not found"}), 404
    result = []
    for t in topics:
        td = t.to_dict()
        content = get_content_by_topic_id(t.id, user_id)
        td["has_content"] = bool(content and content.body)
        result.append(td)
    return jsonify(result)


@topics_bp.route("/api/chapters/<int:chapter_id>/topics", methods=["POST"])
@jwt_required()
def create_new_topic(chapter_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400
    topic = create_topic(chapter_id, user_id, title)
    if not topic:
        return jsonify({"error": "Chapter not found"}), 404
    return jsonify(topic.to_dict()), 201


@topics_bp.route("/api/topics/<int:topic_id>", methods=["PUT"])
@jwt_required()
def update_existing_topic(topic_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    topic = update_topic(topic_id, user_id, title=data.get("title"))
    if not topic:
        return jsonify({"error": "Topic not found"}), 404
    return jsonify(topic.to_dict())


@topics_bp.route("/api/topics/<int:topic_id>", methods=["DELETE"])
@jwt_required()
def delete_existing_topic(topic_id):
    user_id = get_jwt_identity()
    success = delete_topic(topic_id, user_id)
    if not success:
        return jsonify({"error": "Topic not found"}), 404
    return jsonify({"message": "Deleted"})


@topics_bp.route("/api/chapters/<int:chapter_id>/topics/reorder", methods=["PUT"])
@jwt_required()
def reorder_existing_topics(chapter_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    topic_ids = data.get("topic_ids", [])
    if not topic_ids:
        return jsonify({"error": "topic_ids required"}), 400
    topics = reorder_topics(chapter_id, user_id, topic_ids)
    if topics is None:
        return jsonify({"error": "Chapter not found"}), 404
    return jsonify([t.to_dict() for t in topics])
