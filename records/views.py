from flask import Blueprint, request, jsonify
from flask_cors import CORS

from tools.token_utils import decode_token
from records.record import get_records_data, delete_records
import logging
logging.basicConfig(level=logging.INFO)

records_views = Blueprint('records_views', __name__)
CORS(records_views)

@records_views.route('/get_records_data', methods=['POST'])
def get_records_data_route():
	# token认证
	auth = request.headers.get('Authorization', '')
	parts = auth.split()
	if len(parts) != 2 or parts[0].lower() != 'bearer':
		return jsonify({'message': 'missing or invalid Authorization header', 'data': ''}), 401
	token = parts[1]
	ok, payload = decode_token(token)
	logging.info(payload)
	if not ok:
		return jsonify({'message': payload, 'data': ''}), 401
	account = payload.get('account')
	if not account:
		return jsonify({'message': 'no account in token', 'data': ''}), 401

	# 获取数据
	data = get_records_data(account)
	return jsonify({'message': '获取成功', 'data': data}), 200

@records_views.route('/delete_records_data', methods=['POST'])
def delete_records_data_route():
	# token认证
	auth = request.headers.get('Authorization', '')
	parts = auth.split()
	if len(parts) != 2 or parts[0].lower() != 'bearer':
		return jsonify({'message': 'missing or invalid Authorization header', 'data': ''}), 401
	token = parts[1]
	ok, payload = decode_token(token)
	logging.info(payload)
	if not ok:
		return jsonify({'message': payload, 'data': ''}), 401

	# 获取 sche_id
	req_json = request.get_json(force=True)
	sche_id = req_json.get('sche_id')
	if not sche_id:
		return jsonify({'message': 'sche_id is required', 'data': ''}), 400

	# 删除记录
	success = delete_records(sche_id)
	if success:
		return jsonify({'message': '删除成功', 'data': ''}), 200
	else:
		return jsonify({'message': '未找到该记录或删除失败', 'data': ''}), 500

