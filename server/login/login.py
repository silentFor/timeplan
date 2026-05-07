import re
from timeplan.extensions import db
from timeplan.model import Usermsg
from tools.token_utils import generate_token
from message.verification import verify_code
from datetime import datetime, timedelta

# 时区偏移（北京时间 UTC+8）
TIMEZONE_OFFSET = timedelta(hours=8)

def to_beijing_time(dt):
    """将UTC时间转换为北京时间"""
    if not dt:
        return None
    # 如果dt没有时区信息，假设它是UTC时间
    if dt.tzinfo is None:
        dt = dt + TIMEZONE_OFFSET
    return dt.strftime('%Y-%m-%d %H:%M:%S')

def login_user(email: str, password: str):
    """Authenticate user by email and password.

    Returns a tuple: (ok: bool, message: str, data: dict|None)
    """
    if not email or not password:
        return False, '邮箱或密码缺失', None

    user = Usermsg.query.filter_by(email=email).first()
    if not user:
        return False, '邮箱不存在', None

    # NOTE: this compares plain-text passwords to the stored `passwocrd` field.
    # Replace with hashed password check if you store hashed passwords.
    
    if user.passwocrd != password:
        return False, '密码错误', None

    # build response data (exclude password)
    data = {
        'user_id': user.user_id,
        'account': user.account,
        'user_name': user.user_name,
        'email': user.email,
        'is_stat': user.is_stat,
        'c_memo': user.c_memo,
        'create_time': to_beijing_time(user.create_time),
        'update_time': to_beijing_time(user.update_time),
    }
    # 生成JWT token
    token = generate_token(user.user_id, user.email)
    data['token'] = token
    return True, '登录成功', data


def get_user_msg(email: str):
    """根据email查询用户完整信息，返回 user_id, account, user_name, email, c_memo, create_time, update_time（格式化）"""
    if not email:
        return False, '邮箱缺失', None
    user = Usermsg.query.filter_by(email=email).first()
    if not user:
        return False, '用户不存在', None
    def fmt(dt):
        if not dt:
            return None
        return to_beijing_time(dt)
    data = {
        'user_id': user.user_id,
        'account': user.account,
        'user_name': user.user_name,
        'email': user.email,
        'c_memo': user.c_memo,
        'create_time': fmt(user.create_time),
        'update_time': fmt(user.update_time),
    }
    return True, '查询成功', data


PASSWD_RE = re.compile(r'^.{8,}$')


def reset_password(email: str, verification_code: str, new_password: str):
    """通过邮箱验证码重置密码。

    Returns a tuple: (ok: bool, message: str)
    """
    if not email or not verification_code or not new_password:
        return False, '邮箱、验证码和新密码均不能为空'

    if not PASSWD_RE.match(new_password):
        return False, '密码长度至少 8 位'

    user = Usermsg.query.filter_by(email=email).first()
    if not user:
        return False, '该邮箱未注册'

    if not verify_code(email, verification_code):
        return False, '验证码错误或已过期'

    try:
        user.passwocrd = new_password
        user.update_time = datetime.utcnow() + TIMEZONE_OFFSET
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return False, f'密码重置失败: {str(e)}'

    return True, '密码重置成功'
