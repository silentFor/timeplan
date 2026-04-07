from flask import Flask, request, Blueprint, jsonify
from flask_cors import CORS
from tools.token_utils import decode_token

from write_plan import write
import logging
logging.basicConfig(level=logging.INFO)

write_views = Blueprint('user_views', __name__)
CORS(write_views)


@write_views.route('/write_plan_data', methods=['POST'])
def write_plan_data():
    # 验证 Authorization 头并解析 token
    auth = request.headers.get('Authorization', '')
    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return jsonify({'message': 'missing or invalid Authorization header', 'data': ''}), 401

    token = parts[1]
    ok, payload = decode_token(token)
    if not ok:
        

        return jsonify({'message': payload, 'data': ''}), 401
    user_id = payload.get('user_id')
    if not user_id:
        return jsonify({'message': 'no user id in token', 'data': ''}), 401

    # 读取请求 JSON 数据
    param = request.get_json() or {}
    if not param:
        return jsonify({'message': '上传数据缺失', 'data': ''}), 400

    # 获取请求中的字段
    v_date = param.get('v_date', '')
    title = param.get('title', '')
    content = param.get('content', '')
    account = param.get('account', '')  
    logging.info([v_date, title, content, account])

    # 调用数据处理函数
    flat = write.write_plan_data(v_date, title, content, account)
    if flat is False:
        return jsonify({'code':-1,'message': '保存错误', 'data': ''}), 500
    return jsonify({'code':0,'message': '日程安排成功', 'data': []}), 201


