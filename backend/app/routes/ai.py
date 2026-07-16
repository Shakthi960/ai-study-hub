from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.ai_service import ai_chat, generate_quiz
from app.services.content_service import get_all_contents_for_chapter
from app.services.quiz_service import save_quiz_attempt, get_quiz_history

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/api/ai/chat", methods=["POST"])
@jwt_required()
def chat():
    user_id = get_jwt_identity()
    data = request.get_json()
    message = data.get("message", "").strip()
    chapter_id = data.get("chapter_id")

    if not message:
        return jsonify({"error": "Message is required"}), 400

    chapter_contents = None
    if chapter_id:
        chapter_contents = get_all_contents_for_chapter(chapter_id, user_id)

    try:
        response = ai_chat(message, chapter_contents)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_bp.route("/api/ai/quiz", methods=["POST"])
@jwt_required()
def quiz():
    user_id = get_jwt_identity()
    data = request.get_json()
    chapter_id = data.get("chapter_id")
    chapter_title = data.get("chapter_title", "")

    if not chapter_id:
        return jsonify({"error": "chapter_id required"}), 400

    contents = get_all_contents_for_chapter(chapter_id, user_id)
    if not contents:
        return jsonify({"error": "No content found for chapter"}), 404

    non_empty = [c for c in contents if c.get("body", "").strip()]
    if not non_empty:
        return jsonify({"error": "Chapter has no content to quiz on"}), 400

    try:
        questions = generate_quiz(non_empty, chapter_title)
        return jsonify({"questions": questions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_bp.route("/api/ai/quiz/submit", methods=["POST"])
@jwt_required()
def submit_quiz():
    user_id = get_jwt_identity()
    data = request.get_json()
    chapter_id = data.get("chapter_id")
    chapter_title = data.get("chapter_title", "")
    questions = data.get("questions", [])
    answers = data.get("answers", {})

    if not questions:
        return jsonify({"error": "questions required"}), 400

    score = 0
    for i, q in enumerate(questions):
        user_answer = answers.get(str(i))
        if user_answer is not None and int(user_answer) == q.get("correct_answer"):
            score += 1

    attempt = save_quiz_attempt(
        user_id=user_id,
        chapter_id=chapter_id,
        chapter_title=chapter_title,
        score=score,
        total_questions=len(questions),
        questions_data=questions,
        answers_data=answers,
    )
    return jsonify(attempt.to_dict()), 201


@ai_bp.route("/api/ai/quiz/history", methods=["GET"])
@jwt_required()
def quiz_history():
    user_id = get_jwt_identity()
    chapter_id = request.args.get("chapter_id", type=int)
    history = get_quiz_history(user_id, chapter_id)
    return jsonify([h.to_dict() for h in history])
