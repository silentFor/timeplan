# TimePlan 日程管理系统

一个全栈日程管理应用，包含 React 前端和 Flask 后端，支持定时邮件提醒功能。

## 项目结构

```
timeplan/
├── server/                 # Flask 后端
│   ├── app.py             # 应用入口
│   ├── requirements.txt   # Python 依赖
│   ├── deploy.sh          # 部署脚本
│   ├── DEPLOY.md          # 部署文档
│   ├── message/           # 邮件模块
│   ├── login/             # 用户认证模块
│   ├── records/           # 日程记录模块
│   ├── timeplan/          # 数据库模型
│   └── ...
└── web/                   # React 前端
    ├── package.json       # Node 依赖
    ├── public/            # 静态资源
    └── src/               # 源代码
        ├── components/    # 组件
        ├── register_login/# 登录注册
        ├── records/       # 日程记录
        ├── today_plan/    # 今日计划
        ├── write_plan/    # 写计划
        └── ...
```

## 功能特性

- ✅ 用户注册/登录/信息修改
- ✅ 日程创建/查询/删除
- ✅ 定时邮件提醒（每天早6点）
- ✅ JWT Token 认证
- ✅ 响应式界面设计

## 快速开始

### 后端启动

```bash
cd server

# 1. 创建虚拟环境（推荐）
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# 或 .venv\Scripts\activate  # Windows

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的配置

# 4. 初始化数据库
python create_tables.py

# 5. 启动服务
python app.py
```

服务运行在 http://localhost:5000

### 前端启动

```bash
cd web
npm install
npm start
```

开发服务器运行在 http://localhost:3000

## 服务器部署

详见 [server/DEPLOY.md](./server/DEPLOY.md)

一键部署：
```bash
cd server
chmod +x deploy.sh
./deploy.sh
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + CSS3 |
| 后端 | Flask + Gunicorn |
| 数据库 | SQLite |
| 定时任务 | APScheduler |
| 邮件服务 | SMTP |
| 部署 | Nginx + Systemd |

## API 接口

| 接口 | 路径 | 说明 |
|------|------|------|
| 注册 | POST /auth/register | 用户注册 |
| 登录 | POST /auth/login | 用户登录 |
| 创建日程 | POST /write/write_plan_data | 创建日程 |
| 查询日程 | POST /records/get_records_data | 获取日程列表 |
| 删除日程 | POST /records/delete_records_data | 删除日程 |
| 发送邮件 | POST /msg/daily_send_email | 手动触发邮件 |

## 许可证

MIT
