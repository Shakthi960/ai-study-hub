from datetime import datetime, timezone
from app.extensions import db


class QuizHistory(db.Model):
    __tablename__ = "quiz_history"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    chapter_id = db.Column(db.Integer, nullable=False)
    chapter_title = db.Column(db.String(255), nullable=True)
    score = db.Column(db.Integer, nullable=False, default=0)
    total_questions = db.Column(db.Integer, nullable=False, default=0)
    questions_data = db.Column(db.JSON, nullable=True)
    answers_data = db.Column(db.JSON, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "chapter_id": self.chapter_id,
            "chapter_title": self.chapter_title,
            "score": self.score,
            "total_questions": self.total_questions,
            "questions_data": self.questions_data,
            "answers_data": self.answers_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
