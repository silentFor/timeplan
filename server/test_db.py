from app import app
from timeplan.model import DailySchedule

with app.app_context():
    print(DailySchedule.query.all())