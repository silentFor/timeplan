import re
from timeplan.extensions import db
from timeplan.model import Usermsg
from tools.token_utils import generate_token
from message.verification import verify_code
import datetime

# 时区偏移（北京时间 UTC+8）
TIMEZONE_OFFSET = datetime.timedelta(hours=8)

EMAIL_RE = re.compile(r'^[\w\.-]+@[\w\.-]+\.\w+$')

def get_beijing_time():
    """获取北京时间"""
    return datetime.datetime.utcnow() + TIMEZONE_OFFSET


def update_user_msg(user_id, user_name, email, c_memo, verification_code=None):
    """
    根据user_id更新Usermsg表的用户名、邮箱、c_memo（账号不可修改）
    如果修改邮箱，需要提供 verification_code 进行验证
    """
    if not user_id:
        return False, 'user_id缺失', None
    user = Usermsg.query.filter_by(user_id=user_id).first()
    if not user:
        return False, '用户不存在', None

    if user_name:
        user.user_name = user_name

    if email and email != user.email:
        if not EMAIL_RE.match(email):
            return False, '邮箱格式不正确', None
        if not verification_code:
            return False, '修改邮箱需要验证码', None
        if not verify_code(email, verification_code):
            return False, '验证码错误或已过期', None
        user.email = email

    if c_memo is not None:
        user.c_memo = c_memo
    user.update_time = get_beijing_time()

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return False, f'更新失败: {str(e)}', None

    data = {
        'user_id': user.user_id,
        'account': user.account,
        'user_name': user.user_name,
        'email': user.email,
        'c_memo': user.c_memo,
        'create_time': user.create_time.strftime('%Y-%m-%d %H:%M:%S') if user.create_time else None,
        'update_time': user.update_time.strftime('%Y-%m-%d %H:%M:%S') if user.update_time else None,
    }
    # 更新后生成新token
    token = generate_token(user.user_id, user.email)
    data['token'] = token
    return True, '用户信息更新成功', data


def update_user_email(user_id, new_email, verification_code):
    """
    专门用于修改用户邮箱的接口。
    验证验证码后更新数据库中的邮箱，并返回新 token。
    """
    if not user_id:
        return False, 'user_id缺失', None
    if not new_email:
        return False, '邮箱不能为空', None
    if not EMAIL_RE.match(new_email):
        return False, '邮箱格式不正确', None
    if not verification_code:
        return False, '验证码不能为空', None

    user = Usermsg.query.filter_by(user_id=user_id).first()
    if not user:
        return False, '用户不存在', None

    if user.email == new_email:
        return False, '新邮箱不能与当前邮箱相同', None

    # 检查新邮箱是否已被其他用户使用
    existing = Usermsg.query.filter_by(email=new_email).first()
    if existing:
        return False, '该邮箱已被其他用户使用', None

    # 验证邮箱验证码
    if not verify_code(new_email, verification_code):
        return False, '验证码错误或已过期', None

    try:
        user.email = new_email
        user.update_time = get_beijing_time()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return False, f'邮箱更新失败: {str(e)}', None

    data = {
        'user_id': user.user_id,
        'account': user.account,
        'user_name': user.user_name,
        'email': user.email,
        'c_memo': user.c_memo,
        'create_time': user.create_time.strftime('%Y-%m-%d %H:%M:%S') if user.create_time else None,
        'update_time': user.update_time.strftime('%Y-%m-%d %H:%M:%S') if user.update_time else None,
    }
    token = generate_token(user.user_id, user.email)
    data['token'] = token
    return True, '邮箱修改成功', data
