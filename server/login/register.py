import re
import uuid
from typing import Tuple, Optional

from timeplan.extensions import db
from timeplan.model import Usermsg
from message.verification import verify_code
from tools.token_utils import generate_token

EMAIL_RE = re.compile(r'^[\w\.-]+@[\w\.-]+\.\w+$')


def validate_registration_fields(password: str, email: str, verification_code: str) -> Tuple[bool, str]:
	if not email:
		return False, '邮箱不能为空'
	if not EMAIL_RE.match(email):
		return False, '邮箱格式不正确'
	if not verification_code:
		return False, '验证码不能为空'
	if not password:
		return False, '密码不能为空'
	if len(password) < 8:
		return False, '密码长度至少 8 位'
	return True, ''


def register_user(password: str, email: str, verification_code: str, user_name: Optional[str] = None, c_memo: Optional[str] = None):
	"""Register a new user. Returns (ok, message, data).

	Data contains the created user's id, account and email on success.
	"""
	ok, msg = validate_registration_fields(password, email, verification_code)
	if not ok:
		return False, msg, None

	# check email uniqueness
	if Usermsg.query.filter_by(email=email).first():
		return False, '邮箱已存在', None

	# verify email code
	if not verify_code(email, verification_code):
		return False, '验证码错误或已过期', None

	# generate a random account with uuid
	account = str(uuid.uuid4()).replace('-', '')[:20]
	# ensure uniqueness (very unlikely to collide, but handle it)
	while Usermsg.query.filter_by(account=account).first():
		account = str(uuid.uuid4()).replace('-', '')[:20]

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

	token = generate_token(user.user_id, user.email)
	data = {'user_id': user.user_id, 'account': user.account, 'email': user.email, 'token': token}
	return True, '注册成功', data
