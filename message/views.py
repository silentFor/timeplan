from flask import Blueprint, request, jsonify
from flask_cors import CORS

from message import sendmsg
import logging
logging.basicConfig(level=logging.INFO)

msg_views = Blueprint('msg_views', __name__)
CORS(msg_views)

@msg_views.route('/daily_send_email', methods=['POST','GET'])
def daily_send_email():
	sendmsg.daily_deal_data()
	return jsonify({'message': '已发送', 'data': []}), 200





