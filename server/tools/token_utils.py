import jwt
import datetime

SECRET_KEY = 'your_secret_key'  # 建议实际项目用环境变量
EXPIRE_HOURS = 168  # token过期时间，单位小时  一周

def generate_token(user_id, account, expire_hours=EXPIRE_HOURS):
    payload = {
        'user_id': user_id,
        'account': account,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=expire_hours)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    return token

def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return True, payload
    except jwt.ExpiredSignatureError:
        return False, 'Token已过期'
    except jwt.InvalidTokenError:
        return False, '无效Token'
