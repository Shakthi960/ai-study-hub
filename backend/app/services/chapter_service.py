from datetime import datetime, timezone
from app.extensions import db
from app.models.chapter import Chapter


def get_chapters_by_user(user_id):
    return Chapter.query.filter_by(user_id=user_id).order_by(Chapter.updated_at.desc()).all()


def get_chapter_by_id(chapter_id, user_id):
    return Chapter.query.filter_by(id=chapter_id, user_id=user_id).first()


def create_chapter(user_id, title, description=None):
    chapter = Chapter(user_id=user_id, title=title, description=description)
    db.session.add(chapter)
    db.session.commit()
    return chapter


def update_chapter(chapter_id, user_id, title=None, description=None):
    chapter = get_chapter_by_id(chapter_id, user_id)
    if not chapter:
        return None
    if title is not None:
        chapter.title = title
    if description is not None:
        chapter.description = description
    chapter.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return chapter


def delete_chapter(chapter_id, user_id):
    chapter = get_chapter_by_id(chapter_id, user_id)
    if not chapter:
        return False
    db.session.delete(chapter)
    db.session.commit()
    return True


def search_chapters(user_id, query):
    pattern = f"%{query}%"
    return Chapter.query.filter(
        Chapter.user_id == user_id,
        db.or_(
            Chapter.title.ilike(pattern),
            Chapter.description.ilike(pattern),
        ),
    ).order_by(Chapter.updated_at.desc()).all()


def toggle_chapter_public(chapter_id, user_id):
    chapter = get_chapter_by_id(chapter_id, user_id)
    if not chapter:
        return None
    chapter.is_public = not chapter.is_public
    chapter.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return chapter


def get_public_chapters():
    return Chapter.query.filter_by(is_public=True).order_by(Chapter.updated_at.desc()).all()


def get_public_chapter_by_id(chapter_id):
    return Chapter.query.filter_by(id=chapter_id, is_public=True).first()
