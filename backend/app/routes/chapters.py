from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.chapter_service import (
    get_chapters_by_user,
    get_chapter_by_id,
    create_chapter,
    update_chapter,
    delete_chapter,
    search_chapters,
    toggle_chapter_public,
    get_public_chapters,
    get_public_chapter_by_id,
    can_access_chapter,
)

chapters_bp = Blueprint("chapters", __name__)


@chapters_bp.route("/api/chapters", methods=["GET"])
@jwt_required()
def list_chapters():
    user_id = get_jwt_identity()
    query = request.args.get("q")
    if query:
        chapters = search_chapters(user_id, query)
    else:
        chapters = get_chapters_by_user(user_id)
    return jsonify([c.to_dict() for c in chapters])


@chapters_bp.route("/api/chapters/<int:chapter_id>", methods=["GET"])
@jwt_required()
def get_chapter(chapter_id):
    user_id = get_jwt_identity()
    chapter, is_owner = can_access_chapter(chapter_id, user_id)
    if not chapter:
        return jsonify({"error": "Chapter not found"}), 404
    data = chapter.to_dict(include_topics=True)
    data["is_owner"] = is_owner
    return jsonify(data)


@chapters_bp.route("/api/chapters", methods=["POST"])
@jwt_required()
def create_new_chapter():
    user_id = get_jwt_identity()
    data = request.get_json()
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400
    chapter = create_chapter(user_id, title, data.get("description"))
    return jsonify(chapter.to_dict()), 201


@chapters_bp.route("/api/chapters/<int:chapter_id>", methods=["PUT"])
@jwt_required()
def update_existing_chapter(chapter_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    chapter = update_chapter(
        chapter_id, user_id,
        title=data.get("title"),
        description=data.get("description"),
    )
    if not chapter:
        return jsonify({"error": "Chapter not found"}), 404
    return jsonify(chapter.to_dict())


@chapters_bp.route("/api/chapters/<int:chapter_id>", methods=["DELETE"])
@jwt_required()
def delete_existing_chapter(chapter_id):
    user_id = get_jwt_identity()
    success = delete_chapter(chapter_id, user_id)
    if not success:
        return jsonify({"error": "Chapter not found"}), 404
    return jsonify({"message": "Deleted"})


@chapters_bp.route("/api/chapters/<int:chapter_id>/toggle-public", methods=["PUT"])
@jwt_required()
def toggle_public(chapter_id):
    user_id = get_jwt_identity()
    chapter = toggle_chapter_public(chapter_id, user_id)
    if not chapter:
        return jsonify({"error": "Chapter not found"}), 404
    return jsonify(chapter.to_dict())


@chapters_bp.route("/api/chapters/public", methods=["GET"])
def list_public_chapters():
    chapters = get_public_chapters()
    return jsonify([c.to_dict() for c in chapters])


@chapters_bp.route("/api/chapters/public/<int:chapter_id>", methods=["GET"])
def get_public_chapter(chapter_id):
    chapter = get_public_chapter_by_id(chapter_id)
    if not chapter:
        return jsonify({"error": "Chapter not found"}), 404
    return jsonify(chapter.to_dict(include_topics=True))
