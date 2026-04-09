from datetime import datetime, date, timedelta

from timeplan.extensions import db
from timeplan.model import DailySchedule
import logging

logging.basicConfig(level=logging.INFO)

# 时区偏移（北京时间 UTC+8）
TIMEZONE_OFFSET = timedelta(hours=8)

def get_beijing_date():
    """获取北京时间的日期"""
    return (datetime.utcnow() + TIMEZONE_OFFSET).date()

def write_plan_data(v_date, title, content, account):
    """Save a plan to DailySchedule.

    `sche_id` is managed by the database auto-increment.
    `v_date` accepts a `YYYY-MM-DD` string or a `date` object.
    Returns a dict with the new `sche_id` on success, or '' on validation error.
    """
    if not v_date or not title:
        return ''

    # parse v_date
    try:
        if isinstance(v_date, str):
            logging.info(111)
            try:
                v_date_obj = datetime.strptime(v_date, '%Y-%m-%d').date()
            except ValueError:
                v_date_obj = datetime.strptime(v_date, '%Y%m%d').date()
        elif isinstance(v_date, date):
            v_date_obj = v_date
        else:
            v_date_obj = date.fromisoformat(str(v_date))
    except Exception as e:
        logging.error(f'Error parsing v_date: {e}')
        return False

    # set is_stat to 0 if the plan date is before today, otherwise 1 (使用北京时间)
    is_stat_val = 0 if v_date_obj < get_beijing_date() else 1
    rec = DailySchedule(
        account=account,
        v_date=v_date_obj,
        v_title=title,
        v_content=content,
        is_stat=is_stat_val,
    )

    db.session.add(rec)
    db.session.commit()

    return True
    

