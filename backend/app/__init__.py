import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import config
from app.models import init_db


def create_app(config_name="development"):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config[config_name])

    CORS(app, origins=app.config.get("CORS_ORIGINS", "*").split(","), supports_credentials=True)
    JWTManager(app)
    init_db(app)

    from app.routes.auth import auth_bp
    from app.routes.chapters import chapters_bp
    from app.routes.topics import topics_bp
    from app.routes.contents import contents_bp
    from app.routes.ai import ai_bp
    from app.routes.uploads import uploads_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(chapters_bp)
    app.register_blueprint(topics_bp)
    app.register_blueprint(contents_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(uploads_bp)

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    if os.getenv("FLASK_ENV") == "production":
        static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
        assets_dir = os.path.join(static_dir, "assets")

        @app.route("/assets/<path:filename>")
        def serve_assets(filename):
            return send_from_directory(assets_dir, filename)

        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_frontend(path):
            file_path = os.path.join(static_dir, path)
            if path and os.path.isfile(file_path):
                return send_from_directory(static_dir, path)
            return send_from_directory(static_dir, "index.html")

    return app
