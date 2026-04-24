from flask import Blueprint, request, jsonify
from flask_cors import CORS

from message import sendmsg
from message.verification import send_verification_code
import logging
logging.basicConfig(level=logging.INFO)

msg_views = Blueprint('msg_views', __name__)
CORS(msg_views)

@msg_views.route('/daily_send_email', methods=['POST','GET'])
def daily_send_email():
	sendmsg.daily_deal_data()
	return jsonify({'message': '已发送', 'data': []}), 200


@msg_views.route('/send_verification_code', methods=['POST'])
def send_verification_code_route():
	param = request.get_json() or {}
	email = param.get('email', '').strip()
	ok, message = send_verification_code(email)
	status = 200 if ok else 400
	return jsonify({'message': message}), status
