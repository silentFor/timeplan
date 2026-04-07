from app import app
from timeplan.extensions import db

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # print created tables for quick verification
        try:
            names = db.engine.table_names()
        except Exception:
            # SQLAlchemy newer API fallback
            from sqlalchemy import inspect
            names = inspect(db.engine).get_table_names()
        print('created tables:', names)
