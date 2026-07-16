from app.extensions import db
from app.models.quiz_history import QuizHistory


def save_quiz_attempt(user_id, chapter_id, chapter_title, score, total_questions, questions_data, answers_data):
    attempt = QuizHistory(
        user_id=user_id,
        chapter_id=chapter_id,
        chapter_title=chapter_title,
        score=score,
        total_questions=total_questions,
        questions_data=questions_data,
        answers_data=answers_data,
    )
    db.session.add(attempt)
    db.session.commit()
    return attempt


def get_quiz_history(user_id, chapter_id=None):
    query = QuizHistory.query.filter_by(user_id=user_id)
    if chapter_id:
        query = query.filter_by(chapter_id=chapter_id)
    return query.order_by(QuizHistory.created_at.desc()).all()
