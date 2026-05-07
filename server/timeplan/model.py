from timeplan.extensions import db
from sqlalchemy.sql import func

class DailySchedule(db.Model):
    __tablename__ = 'daily_schedule'  # 数据库表名

    sche_id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # 唯一且不为空的主键
    v_date = db.Column(db.Date, nullable=False)                            # 不可为空的日期字段
    v_title = db.Column(db.String(255), nullable=False)                   # 不可为空的标题字段
    v_content = db.Column(db.Text, nullable=True)                         # 可容纳长文本的内容字段
    is_stat = db.Column(db.SmallInteger, default=1)                       # 状态字段，默认为 1
    account = db.Column(db.String(150), db.ForeignKey('usermsg.account'), nullable=False)  # 关联Usermsg.account，不能为空
    create_time = db.Column(db.TIMESTAMP, server_default=func.now())     # 创建时间，默认为当前时间
    update_time = db.Column(db.TIMESTAMP, server_default=func.now(), server_onupdate=func.now())  # 更新时间，默认为当前时间

    def __repr__(self):
        return f"<DailySchedule(sche_id={self.sche_id}, v_date={self.v_date}, v_title='{self.v_title}')>"


class Usermsg(db.Model):
    __tablename__ = 'usermsg'
    
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    account = db.Column(db.String(150), nullable=False, unique=True)
    user_name = db.Column(db.String(150), nullable=True)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    is_stat = db.Column(db.SmallInteger, default=1)
    c_memo = db.Column(db.Text, nullable=True)
    create_time = db.Column(db.TIMESTAMP, server_default=func.now())
    update_time = db.Column(db.TIMESTAMP, server_default=func.now(), server_onupdate=func.now())

    def __repr__(self):
        return f"<Usermsg(user_id={self.user_id}, account='{self.account}', email='{self.email}')>"


class EmailVerificationCode(db.Model):
    __tablename__ = 'email_verification_code'

    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    code = db.Column(db.String(10), nullable=False)
    status = db.Column(db.SmallInteger, default=1)  # 1: 有效, 0: 失效
    c_memo = db.Column(db.Text, nullable=True)
    create_time = db.Column(db.TIMESTAMP, server_default=func.now())
    update_time = db.Column(db.TIMESTAMP, server_default=func.now(), server_onupdate=func.now())

    def __repr__(self):
        return f"<EmailVerificationCode(id='{self.id}', email='{self.email}', status={self.status})>"


class EmailSendRecord(db.Model):
    __tablename__ = 'email_send_record'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    account = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    send_content = db.Column(db.Text, nullable=True)
    status = db.Column(db.SmallInteger, default=1)  # 1: 成功, 0: 失败
    c_memo = db.Column(db.Text, nullable=True)
    create_time = db.Column(db.TIMESTAMP, server_default=func.now())
    update_time = db.Column(db.TIMESTAMP, server_default=func.now(), server_onupdate=func.now())

    def __repr__(self):
        return f"<EmailSendRecord(account='{self.account}', email='{self.email}', status={self.status})>"
