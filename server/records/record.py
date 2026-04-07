from timeplan.model import DailySchedule
import logging
logging.basicConfig(level=logging.INFO)


def get_records_data(account):
    """
    获取指定账号的DailySchedule数据，返回指定字段
    """
    result = []
    try:
        records = DailySchedule.query.filter_by(account=account).order_by(DailySchedule.v_date.desc(), DailySchedule.create_time.desc()).all()
        for r in records:
            result.append({
                'sche_id': r.sche_id,
                'v_date': r.v_date.strftime('%Y-%m-%d') if r.v_date else None,
                'v_title': r.v_title,
                'v_content': r.v_content,
                'is_stat': r.is_stat,
                'account': r.account,
                'create_time': r.create_time.strftime('%Y-%m-%d %H:%M:%S') if r.create_time else None
            })
    except Exception as e:
        logging.info(f"Error fetching records: {e}")
        return []
    return result


def delete_records(sche_id):
    """
    根据 sche_id 删除 DailySchedule 记录。
    返回 True 表示删除成功，False 表示未找到或异常。
    """
    try:
        rec = DailySchedule.query.filter_by(sche_id=sche_id).first()
        if rec:
            from timeplan.extensions import db
            db.session.delete(rec)
            db.session.commit()
            return True
        else:
            return False
    except Exception as e:
        logging.info(f"Error deleting record: {e}")
        return False


