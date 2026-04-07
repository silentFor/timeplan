

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from timeplan.model import DailySchedule, Usermsg
from timeplan.extensions import db

import pandas as pd
from datetime import datetime, timedelta

import logging
logging.basicConfig(level=logging.INFO)


def daily_deal_data():
    """
    获取DailySchedule表中is_stat为1的数据，联合Usermsg表获取email字段
    按照account分组，将每个account的数据df传入send_email
    字段 sche_id、v_date、v_title、v_content、is_stat、account、email
    """
    try:
        # 联合查询DailySchedule和Usermsg表
        results = db.session.query(
            DailySchedule.sche_id,
            DailySchedule.v_date,
            DailySchedule.v_title,
            DailySchedule.v_content,
            DailySchedule.is_stat,
            DailySchedule.account,
            Usermsg.email
        ).join(
            Usermsg, DailySchedule.account == Usermsg.account
        ).filter(
            DailySchedule.is_stat == 1
        ).all()
        
        # 构建返回数据列表
        data_list = []
        for item in results:
            data_list.append({
                'sche_id': item.sche_id,
                'v_date': item.v_date.strftime('%Y-%m-%d') if item.v_date else None,
                'v_title': item.v_title,
                'v_content': item.v_content,
                'is_stat': item.is_stat,
                'account': item.account,
                'email': item.email
            })
    except Exception as e:
        logging.error("获取DailySchedule数据失败: %s", e)
        return []
    
    df = pd.DataFrame(data_list)
    if df.empty:
        return True
    
    # 将日期不满足的排除，只保留今天或明天的数据
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    # 将v_date转换为日期类型进行过滤
    df['v_date'] = pd.to_datetime(df['v_date']).dt.date
    df = df[df['v_date'].isin([today, tomorrow])]
    
    if df.empty:
        logging.info("没有今天或明天的待办事项")
        return True
    
    # 按照account分组，为每个account发送邮件
    for account, group_df in df.groupby('account'):
        deal_min_email_data(group_df)
    return df

def deal_min_email_data(df):
    """
    处理数据，按日期分组发送邮件
    - v_date为今天的发送一次邮件
    - v_date为明天的发送一次邮件
    - 单条：subject=v_title, body=v_content
    - 多条：subject="您今天/明天有N条日程安排", body=格式化列表
    """
    # 获取今天和明天的日期
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    
    # 获取该用户的email（同一个账号的email是一样的，取第一条）
    receiver_email = df['email'].iloc[0]
    
    # 按照v_date分组处理
    for date_val, date_df in df.groupby('v_date'):
        count = len(date_df)
        if count == 0:
            continue  # 没有数据，跳过
        
        # 判断是今天还是明天
        if date_val == today:
            date_desc = "今天"
        elif date_val == tomorrow:
            date_desc = "明天"
        else:
            continue  # 跳过非今天明天的数据
        
        if count == 1:
            # 只有一条记录
            row = date_df.iloc[0]
            subject = row['v_title']
            body = row['v_content'] if row['v_content'] else ''
        else:
            # 多条记录
            subject = f"您{date_desc}有{count}条日程安排"
            
            # 构建body内容
            body_lines = []
            for idx, (_, row) in enumerate(date_df.iterrows(), start=1):
                body_lines.append(f"{idx}、{row['v_title']}")
                if row['v_content']:
                    body_lines.append(f"{row['v_content']}")
                body_lines.append("")  # 空行分隔
            
            body = "\n".join(body_lines).strip()
        
        # 发送邮件
        send_email(receiver_email, subject, body)
        logging.info(f"已向 {receiver_email} 发送{date_desc}的邮件: {subject}")
    
    return True

def send_email(receiver_email, subject, body):
    # 1. 邮件基本信息
    # QQ 邮箱配置
    smtp_server = 'smtp.qq.com'
    smtp_port = 587
    sender_email = '3128368084@qq.com'
    # QQ 邮箱需要使用授权码，不是登录密码
    # 获取方式：QQ邮箱 -> 设置 -> 账户 -> 开启SMTP服务 -> 获取授权码
    password = 'ubumagilbfwhdfeb'

    # 2. 构建邮件内容
    message = MIMEMultipart()
    message['From'] = sender_email
    message['To'] = receiver_email
    message['Subject'] = subject

    # 邮件正文
    message.attach(MIMEText(body, 'plain'))

    # 3. 发送邮件
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # 启用 TLS 安全传输
        server.login(sender_email, password)
        server.send_message(message)
    except Exception as e:
        logging.error("邮件发送失败: %s", e)
    finally:
        server.quit()