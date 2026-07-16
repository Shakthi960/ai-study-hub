from datetime import datetime, timezone
from app.extensions import db
from app.models.topic import Topic
from app.models.chapter import Chapter
from app.models.content import Content


def get_topics_for_chapter(chapter_id, user_id):
    chapter = Chapter.query.filter_by(id=chapter_id).first()
    if not chapter:
        return None
    if chapter.user_id != user_id and not chapter.is_public:
        return None
    return Topic.query.filter_by(chapter_id=chapter_id).order_by(Topic.order_index).all()


def get_topic_by_id(topic_id, user_id):
    topic = Topic.query.get(topic_id)
    if not topic:
        return None
    chapter = Chapter.query.filter_by(id=topic.chapter_id).first()
    if not chapter:
        return None
    if chapter.user_id != user_id and not chapter.is_public:
        return None
    return topic


def create_topic(chapter_id, user_id, title):
    chapter = Chapter.query.filter_by(id=chapter_id, user_id=user_id).first()
    if not chapter:
        return None
    max_order = db.session.query(db.func.max(Topic.order_index)).filter_by(
        chapter_id=chapter_id
    ).scalar() or 0
    topic = Topic(chapter_id=chapter_id, title=title, order_index=max_order + 1)
    content = Content(topic=topic, body="")
    db.session.add(topic)
    db.session.add(content)
    chapter.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return topic


def update_topic(topic_id, user_id, title=None):
    topic = get_topic_by_id(topic_id, user_id)
    if not topic:
        return None
    if title is not None:
        topic.title = title
    topic.updated_at = datetime.now(timezone.utc)
    chapter = Chapter.query.get(topic.chapter_id)
    if chapter:
        chapter.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return topic


def delete_topic(topic_id, user_id):
    topic = get_topic_by_id(topic_id, user_id)
    if not topic:
        return False
    chapter = Chapter.query.get(topic.chapter_id)
    db.session.delete(topic)
    if chapter:
        chapter.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return True


def reorder_topics(chapter_id, user_id, topic_ids):
    chapter = Chapter.query.filter_by(id=chapter_id, user_id=user_id).first()
    if not chapter:
        return None
    for index, tid in enumerate(topic_ids):
        topic = Topic.query.filter_by(id=tid, chapter_id=chapter_id).first()
        if topic:
            topic.order_index = index
    chapter.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return Topic.query.filter_by(chapter_id=chapter_id).order_by(Topic.order_index).all()
