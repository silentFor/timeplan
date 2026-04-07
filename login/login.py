from timeplan.extensions import db
from timeplan.model import Usermsg
from tools.token_utils import generate_token


def login_user(account: str, password: str):
    """Authenticate user by account and password.

    Returns a tuple: (ok: bool, message: str, data: dict|None)
    """
    if not account or not password:
        return False, '账号或密码缺失', None

    user = Usermsg.query.filter_by(account=account).first()
    if not user:
        return False, '账号不存在', None

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
        'create_time': user.create_time,
        'update_time': user.update_time,
    }
    # 生成JWT token
    token = generate_token(user.user_id, user.account)
    data['token'] = token
    return True, '登录成功', data


def get_user_msg(account: str):
    """根据account查询用户完整信息，返回 user_id, account, user_name, email, c_memo, create_time, update_time（格式化）"""
    if not account:
        return False, '账号缺失', None
    user = Usermsg.query.filter_by(account=account).first()
    if not user:
        return False, '账号不存在', None
    def fmt(dt):
        if not dt:
            return None
        return dt.strftime('%Y-%m-%d %H:%M:%S')
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

