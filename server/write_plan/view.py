from flask import Flask, request, Blueprint, jsonify, current_app
from flask_cors import CORS
from tools.token_utils import decode_token

from write_plan import write
from message.sendmsg import send_plan_created_email
from timeplan.model import Usermsg

import threading
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
    email = payload.get('email')
    if not email:
        return jsonify({'message': 'no email in token', 'data': ''}), 401

    # 通过email查询用户account
    user = Usermsg.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': '用户不存在', 'data': ''}), 401
    account = user.account
    user_email = user.email  # 提前取出，避免后台线程访问ORM对象触发懒加载

    # 读取请求 JSON 数据
    param = request.get_json() or {}
    if not param:
        return jsonify({'message': '上传数据缺失', 'data': ''}), 400

    # 获取请求中的字段
    v_date = param.get('v_date', '')
    title = param.get('title', '')
    content = param.get('content', '')
    send_email = param.get('send_email', False)
    logging.info([v_date, title, content, account, send_email])

    # 调用数据处理函数
    flat = write.write_plan_data(v_date, title, content, account)
    if flat is False:
        return jsonify({'code': -1, 'message': '保存错误', 'data': ''}), 500

    # 保存成功后，根据参数决定是否异步发送邮件通知
    if send_email:
        app = current_app._get_current_object()

        def async_send_email(app_instance, user_email, account):
            with app_instance.app_context():
                try:
                    if user_email:
                        send_plan_created_email(user_email, title, v_date, account=account)
                except Exception as e:
                    logging.error("发送计划创建通知邮件失败: %s", e)

        threading.Thread(target=async_send_email, args=(app, user_email, account), daemon=True).start()

    return jsonify({'code': 0, 'message': '日程安排成功', 'data': []}), 201
