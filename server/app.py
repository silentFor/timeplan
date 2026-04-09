from flask import Flask
import os

from timeplan.extensions import db
from timeplan.router import create_app
from flask_migrate import Migrate
from flask_apscheduler import APScheduler

# 定时任务配置
class SchedulerConfig:
    SCHEDULER_API_ENABLED = True
    # 每天早上6点执行任务
    SCHEDULER_JOB_DEFAULTS = {
        'coalesce': False,
        'max_instances': 1
    }


def make_app():
    app = create_app()
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    # secret used for JWT signing/verification; override in production via env
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret')
    
    # 加载定时任务配置
    app.config.from_object(SchedulerConfig())
    
    db.init_app(app)
    # initialize Flask-Migrate
    migrate = Migrate()
    migrate.init_app(app, db)
    
    # 初始化定时任务调度器
    scheduler = APScheduler()
    scheduler.init_app(app)
    
    # 定义定时任务函数（在应用上下文中执行）
    # 早上6点：发送今天和明天的安排
    @scheduler.task('cron', id='morning_email_job', hour=6, minute=0)
    def scheduled_morning_email():
        with app.app_context():
            from message.sendmsg import daily_deal_data
            daily_deal_data()
    
    # 晚上6点：只发送明天的安排
    @scheduler.task('cron', id='evening_email_job', hour=18, minute=0)
    def scheduled_evening_email():
        with app.app_context():
            from message.sendmsg import daily_deal_data
            daily_deal_data()
    
    scheduler.start()
    
    return app


app = make_app()



if __name__ == '__main__':
    app.run()
