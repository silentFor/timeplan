import sqlite3
from pathlib import Path

db_path = Path('instance') / 'site.db'
if not db_path.exists():
    print('Database not found at', db_path)
    raise SystemExit(1)

conn = sqlite3.connect(str(db_path))
cur = conn.cursor()

print('Tables:')
print(cur.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall())

print('\nSchema for daily_schedule:')
print(cur.execute('PRAGMA table_info(daily_schedule);').fetchall())

print('\nFirst 20 rows in daily_schedule:')
try:
    rows = cur.execute(
        'SELECT sche_id, v_date, v_title, v_content, is_stat, create_time, update_time FROM daily_schedule ORDER BY sche_id LIMIT 20;'
    ).fetchall()
    for r in rows:
        print(r)
except Exception as e:
    print('Error reading daily_schedule:', e)

conn.close()
