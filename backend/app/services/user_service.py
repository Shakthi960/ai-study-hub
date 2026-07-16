from app.extensions import db
from app.models.user import User


def get_or_create_user(user_id, email, display_name=None, avatar_url=None):
    user = User.query.get(user_id)
    if not user:
        user = User(
            id=user_id,
            email=email,
            display_name=display_name,
            avatar_url=avatar_url,
        )
        db.session.add(user)
        db.session.commit()
    else:
        if display_name:
            user.display_name = display_name
        if avatar_url:
            user.avatar_url = avatar_url
        db.session.commit()
    return user


def get_user(user_id):
    return User.query.get(user_id)


def delete_user(user_id):
    user = User.query.get(user_id)
    if user:
        db.session.delete(user)
        db.session.commit()
        return True
    return False
