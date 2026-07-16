from datetime import datetime, timezone
from app.extensions import db


class Topic(db.Model):
    __tablename__ = "topics"

    id = db.Column(db.Integer, primary_key=True)
    chapter_id = db.Column(db.Integer, db.ForeignKey("chapters.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    order_index = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    content = db.relationship(
        "Content",
        backref="topic",
        uselist=False,
        lazy=True,
        cascade="all, delete-orphan",
    )

    def to_dict(self, include_content=False):
        data = {
            "id": self.id,
            "chapter_id": self.chapter_id,
            "title": self.title,
            "order_index": self.order_index,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_content and self.content:
            data["content"] = self.content.to_dict()
        return data
