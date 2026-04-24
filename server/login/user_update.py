from timeplan.extensions import db
from timeplan.model import Usermsg
from tools.token_utils import generate_token
import datetime

# 时区偏移（北京时间 UTC+8）
TIMEZONE_OFFSET = datetime.timedelta(hours=8)

def get_beijing_time():
    """获取北京时间"""
    return datetime.datetime.utcnow() + TIMEZONE_OFFSET


def update_user_msg(user_id, user_name, email, c_memo):
    """
    根据user_id更新Usermsg表的用户名、邮箱、c_memo（账号不可修改）
    """
    if not user_id:
        return False, 'user_id缺失', None
    user = Usermsg.query.filter_by(user_id=user_id).first()
    if not user:
        return False, '用户不存在', None

    if user_name:
        user.user_name = user_name
    if email:
        user.email = email
    if c_memo is not None:
        user.c_memo = c_memo
    user.update_time = get_beijing_time()

    db.session.commit()

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
