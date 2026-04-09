from timeplan.extensions import db
from timeplan.model import Usermsg, DailySchedule
from tools.token_utils import generate_token
import datetime

# 时区偏移（北京时间 UTC+8）
TIMEZONE_OFFSET = datetime.timedelta(hours=8)

def get_beijing_time():
    """获取北京时间"""
    return datetime.datetime.utcnow() + TIMEZONE_OFFSET

def update_user_msg(user_id, account, user_name, email, c_memo):
    """
    根据user_id更新Usermsg表的账号、用户名、邮箱、c_memo
    """
    if not user_id:
        return False, 'user_id缺失', None
    user = Usermsg.query.filter_by(user_id=user_id).first()
    if not user:
        return False, '用户不存在', None
    old_account = user.account
    if account:
        user.account = account
    if user_name:
        user.user_name = user_name
    if email:
        user.email = email
    if c_memo is not None:
        user.c_memo = c_memo
    user.update_time = get_beijing_time()
    # 同步更新DailySchedule表中account
    if account and old_account != account:
        DailySchedule.query.filter_by(account=old_account).update({'account': account})
    db.session.commit()
    # 更新后生成新token
    token = generate_token(user.user_id, user.account)
    return True, '用户信息更新成功', {'token': token}

