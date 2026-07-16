from app.extensions import db
from app.models.content import Content
from app.models.topic import Topic
from app.models.chapter import Chapter


def get_content_by_topic_id(topic_id, user_id):
    topic = Topic.query.get(topic_id)
    if not topic:
        return None
    chapter = Chapter.query.filter_by(id=topic.chapter_id, user_id=user_id).first()
    if not chapter:
        return None
    return Content.query.filter_by(topic_id=topic_id).first()


def upsert_content(topic_id, user_id, body, content_type="markdown"):
    topic = Topic.query.get(topic_id)
    if not topic:
        return None
    chapter = Chapter.query.filter_by(id=topic.chapter_id, user_id=user_id).first()
    if not chapter:
        return None

    content = Content.query.filter_by(topic_id=topic_id).first()
    if content:
        content.body = body
        content.content_type = content_type
    else:
        content = Content(topic_id=topic_id, body=body, content_type=content_type)
        db.session.add(content)

    db.session.commit()
    return content


def get_all_contents_for_chapter(chapter_id, user_id):
    chapter = Chapter.query.filter_by(id=chapter_id, user_id=user_id).first()
    if not chapter:
        return None
    topics = Topic.query.filter_by(chapter_id=chapter_id).order_by(Topic.order_index).all()
    result = []
    for topic in topics:
        content = Content.query.filter_by(topic_id=topic.id).first()
        result.append({
            "topic_id": topic.id,
            "topic_title": topic.title,
            "body": content.body if content else "",
        })
    return result
