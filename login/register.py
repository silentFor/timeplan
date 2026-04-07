import re
from typing import Tuple, Optional

from timeplan.extensions import db
from timeplan.model import Usermsg
from tools.token_utils import generate_token

EMAIL_RE = re.compile(r'^[\w\.-]+@[\w\.-]+\.\w+$')
ACCOUNT_RE = re.compile(r'^[A-Za-z0-9_.@]+$')

def validate_registration_fields(account: str, password: str, email: str, user_name: Optional[str], c_memo: Optional[str]) -> Tuple[bool, str]:
	if not account:
		return False, '账号不能为空'
	if not ACCOUNT_RE.match(account):
		return False, '账号只能包含字母、数字、下划线、点和@'
	elif len(account) < 5:
		return False, '账号长度至少 5 位'
	elif len(account) > 30:
		return False, '账号长度最多 30 位'
	if not password:
		return False, '密码不能为空'
	if len(password) < 8:
		return False, '密码长度至少 8 位'
	if not email:
		return False, '邮箱不能为空'
	
	if not EMAIL_RE.match(email):
		return False, '邮箱格式不正确'
	return True, ''

def register_user(account: str, password: str, email: str, user_name: Optional[str] = None, c_memo: Optional[str] = None):
	"""Register a new user. Returns (ok, message, data).

	Data contains the created user's id and account on success.
	"""
	ok, msg = validate_registration_fields(account, password, email, user_name, c_memo)
	if not ok:
		return False, msg, None

	# check uniqueness
	if Usermsg.query.filter_by(account=account).first():
		return False, '账号已存在', None

	try:
		user = Usermsg(
			account=account,
			user_name=user_name,
			passwocrd=password,
			email=email,
			c_memo=c_memo,
			is_stat=1,
		)
		db.session.add(user)
		db.session.commit()
	except Exception as e:
		db.session.rollback()
		return False, f'创建用户失败: {str(e)}', None

	token = generate_token(user.user_id, user.account)
	data = {'user_id': user.user_id, 'account': user.account, 'token': token}
	return True, '注册成功', data
