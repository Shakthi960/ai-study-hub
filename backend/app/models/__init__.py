from app.extensions import db


def init_db(app):
    db.init_app(app)
    with app.app_context():
        from app.models.user import User  # noqa: F401
        from app.models.chapter import Chapter  # noqa: F401
        from app.models.topic import Topic  # noqa: F401
        from app.models.content import Content  # noqa: F401
        from app.models.quiz_history import QuizHistory  # noqa: F401

        db.create_all()
