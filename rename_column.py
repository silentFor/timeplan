#!/usr/bin/env python3
"""
备用脚本：直接修改 SQLite 数据库列名（当 flask db upgrade 不可用时使用）。
用法: python rename_column.py <db_path>
默认: server/instance/timeplan.db
"""
import sqlite3
import sys
import os

DB_PATH = sys.argv[1] if len(sys.argv) > 1 else os.path.join('server', 'instance', 'timeplan.db')

if not os.path.exists(DB_PATH):
    print(f"数据库不存在: {DB_PATH}")
    sys.exit(1)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 检查列是否存在
cursor.execute("PRAGMA table_info(usermsg)")
columns = {col[1] for col in cursor.fetchall()}

if 'password' in columns:
    print("列名已经是 password，无需修改。")
    conn.close()
    sys.exit(0)

if 'passwocrd' not in columns:
    print("未找到 passwocrd 列，请检查数据库。")
    conn.close()
    sys.exit(1)

cursor.execute("ALTER TABLE usermsg RENAME COLUMN passwocrd TO password")
conn.commit()
conn.close()
print(f"✅ 成功将 usermsg.passwocrd 重命名为 password")
print(f"   数据库: {DB_PATH}")
