from flask import Flask, Blueprint

from write_plan.view import write_views
from login.views import login_views
from records.views import records_views
from message.views import msg_views


views_bp = Blueprint('views_bp', __name__)


def create_app():
    app = Flask(__name__)
    views_bp.register_blueprint(write_views, url_prefix='/write')
    views_bp.register_blueprint(login_views, url_prefix='/auth')
    views_bp.register_blueprint(records_views, url_prefix='/records')
    views_bp.register_blueprint(msg_views, url_prefix='/msg')
    app.register_blueprint(views_bp)
    return app


