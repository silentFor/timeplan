from flask import Blueprint, request, jsonify
from flask_cors import CORS

from .login import login_user, get_user_msg
from .user_update import update_user_msg
from .register import register_user


login_views = Blueprint('login_views', __name__)
CORS(login_views)



@login_views.route('/login', methods=['POST'])
def login_route():
	param = request.get_json() or {}
	account = param.get('account')
	password = param.get('password')

	ok, message, data = login_user(account, password)
	status = 200 if ok else 401
	
	return jsonify({'message': message, 'data': data}), status

@login_views.route('/register', methods=['POST'])
def register_route():
	param = request.get_json() or {}
	account = param.get('account')
	password = param.get('password')
	email = param.get('email')
	user_name = param.get('user_name')
	c_memo = param.get('c_memo')

	ok, message, data = register_user(account, password, email, user_name, c_memo)
	status = 200 if ok else 400
	return jsonify({'message': message, 'data': data}), status

@login_views.route('/get_user_msg', methods=['POST'])
def get_user_msg_route():
	param = request.get_json() or {}
	account = param.get('account')
	ok, message, data = get_user_msg(account)
	status = 200 if ok else 404
	return jsonify({'message': message, 'data': data}), status


@login_views.route('/update_user_msg', methods=['POST'])
def update_user_msg_route():
	param = request.get_json() or {}
	user_id = param.get('user_id')
	account = param.get('account')
	user_name = param.get('user_name')
	email = param.get('email')
	c_memo = param.get('c_memo')

	ok, message, data = update_user_msg(user_id, account, user_name, email, c_memo)
	status = 200 if ok else 400
	return jsonify({'message': message, 'data': data}), status


