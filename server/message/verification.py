import random
import re
import uuid
from datetime import datetime, timedelta

from timeplan.extensions import db
from timeplan.model import EmailVerificationCode, Usermsg
from message.sendmsg import send_email

import logging
logging.basicConfig(level=logging.INFO)

EMAIL_RE = re.compile(r'^[\w\.-]+@[\w\.-]+\.\w+$')

# 时区偏移（北京时间 UTC+8）
TIMEZONE_OFFSET = timedelta(hours=8)


def get_beijing_now():
    """获取北京时间的datetime"""
    return datetime.utcnow() + TIMEZONE_OFFSET


def generate_code(length=6):
    """生成指定长度的数字验证码"""
    return ''.join([str(random.randint(0, 9)) for _ in range(length)])


def can_resend(email: str, interval_seconds: int = 60) -> bool:
    """检查指定邮箱是否已经超过重新发送间隔"""
    now = get_beijing_now()
    latest = EmailVerificationCode.query.filter_by(email=email) \
        .order_by(EmailVerificationCode.create_time.desc()).first()
    if not latest:
        return True
    create_time = latest.create_time
    if create_time.tzinfo is not None:
        create_time = create_time.replace(tzinfo=None)
    create_time_beijing = create_time + TIMEZONE_OFFSET
    return (now - create_time_beijing).total_seconds() >= interval_seconds


def send_verification_code(email: str, purpose: str = 'register', current_email: str = None):
    """
    向指定邮箱发送验证码，并在数据库中创建记录。
    purpose: 'register' 或 'update_email'
    current_email: 当前用户邮箱（update_email 场景下用于判断是否是用户自己的邮箱）
    返回 (ok: bool, message: str)
    """
    if not email:
        return False, '邮箱不能为空'
    if not EMAIL_RE.match(email):
        return False, '邮箱格式不正确'

    if purpose == 'register':
        # 检查该邮箱是否已注册
        if Usermsg.query.filter_by(email=email).first():
            return False, '该邮箱已注册'
    elif purpose == 'update_email':
        if email == current_email:
            return False, '新邮箱不能与当前邮箱相同'
        existing = Usermsg.query.filter_by(email=email).first()
        if existing:
            return False, '该邮箱已被其他用户使用'
    elif purpose == 'reset_password':
        # 检查该邮箱是否存在
        if not Usermsg.query.filter_by(email=email).first():
            return False, '该邮箱未注册'
    else:
        return False, '未知的发送目的'

    # 检查是否在一分钟内已发送过
    if not can_resend(email, interval_seconds=60):
        return False, '请稍后再发送验证码'

    code = generate_code(6)
    try:
        record = EmailVerificationCode(
            id=str(uuid.uuid4()),
            email=email,
            code=code,
            status=1,
            c_memo=None
        )
        db.session.add(record)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logging.error("保存验证码记录失败: %s", e)
        return False, '验证码生成失败，请重试'

    if purpose == 'register':
        subject = '时间旅程 - 注册验证码'
        body = f'您的注册验证码是：{code}，5分钟内有效。请勿泄露给他人。'
    elif purpose == 'reset_password':
        subject = '时间旅程 - 重置密码验证码'
        body = f'您的重置密码验证码是：{code}，5分钟内有效。请勿泄露给他人。'
    else:
        subject = '时间旅程 - 修改邮箱验证码'
        body = f'您的修改邮箱验证码是：{code}，5分钟内有效。请勿泄露给他人。'

    try:
        send_email(email, subject, body)
        logging.info("验证码邮件已发送: %s", email)
        return True, '验证码已发送'
    except Exception as e:
        logging.error("发送验证码邮件失败: %s", e)
        return False, '邮件发送失败，请重试'


def _is_expired(record) -> bool:
    """判断单条记录是否已超过5分钟有效期"""
    now = get_beijing_now()
    create_time = record.create_time
    if create_time.tzinfo is not None:
        create_time = create_time.replace(tzinfo=None)
    create_time_beijing = create_time + TIMEZONE_OFFSET
    return (now - create_time_beijing).total_seconds() > 300


def verify_code(email: str, code: str) -> bool:
    """
    验证邮箱验证码是否正确且在有效期内（5分钟内）。
    验证成功后将该记录状态设为 0（失效）。
    若记录已过期，也将其状态设为 0。
    """
    if not email or not code:
        return False

    record = EmailVerificationCode.query.filter_by(email=email, code=code, status=1) \
        .order_by(EmailVerificationCode.create_time.desc()).first()
    if not record:
        return False

    if _is_expired(record):
        # 已过期，更新状态为失效
        try:
            record.status = 0
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logging.error("更新验证码状态失败: %s", e)
        return False

    # 验证通过，标记为已使用（失效）
    try:
        record.status = 0
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logging.error("更新验证码状态失败: %s", e)
    return True
