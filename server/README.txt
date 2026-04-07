# 日程管理系统 (TimePlan Server)

## 项目概述

本项目是一个基于 Flask 的日程管理后端服务，支持用户注册登录、日程安排记录、以及定时邮件提醒功能。

主要功能：
- 用户管理：注册、登录、信息更新
- 日程管理：创建、查询、删除日程安排
- 邮件提醒：每天早上6点自动发送邮件提醒当天和次日的日程



## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量（可选）

创建 `.env` 文件：
```
SECRET_KEY=your-secret-key
```

### 3. 初始化数据库

```bash
python create_tables.py
```

### 4. 启动应用

```bash
python app.py
```

服务将运行在 `http://127.0.0.1:5000`

### 5. 邮件配置（可选）

修改 `message/sendmsg.py` 中的邮件配置：
```python
smtp_server = 'smtp.qq.com'
sender_email = 'your-email@qq.com'
password = 'your-auth-code'  # QQ邮箱授权码
```

## API 接口说明

### 认证相关

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 注册 | POST | /auth/register | 用户注册 |
| 登录 | POST | /auth/login | 用户登录 |
| 获取用户信息 | POST | /auth/get_user_msg | 查询用户信息 |
| 更新用户信息 | POST | /auth/update_user_msg | 更新用户信息 |

### 日程相关

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 创建日程 | POST | /write/write_plan_data | 创建新的日程安排（需Token） |
| 查询日程 | POST | /records/get_records_data | 获取当前用户所有日程（需Token） |
| 删除日程 | POST | /records/delete_records_data | 删除指定日程（需Token） |

### 邮件相关

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 手动发送邮件 | POST/GET | /msg/daily_send_email | 手动触发邮件发送 |

**定时任务**: 每天早上6点自动执行邮件发送

### 请求示例

#### 注册
```bash
curl -X POST http://127.0.0.1:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"account":"testuser", "password":"12345678", "email":"test@qq.com"}'
```

#### 登录
```bash
curl -X POST http://127.0.0.1:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"testuser", "password":"12345678"}'
```

#### 创建日程（需携带Token）
```bash
curl -X POST http://127.0.0.1:5000/write/write_plan_data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"v_date":"2026-04-08", "title":"项目会议", "content":"下午3点开会", "account":"testuser"}'
```

## 邮件提醒规则

系统每天早上6点自动检查并发送邮件：

1. **检查范围**: 只检查今天和明天的日程
2. **单条日程**:
   - 主题: 日程标题
   - 内容: 日程内容
3. **多条日程**:
   - 主题: "您今天/明天有N条日程安排"
   - 内容: 列表形式的日程标题和内容

## 开发说明

- 默认使用 SQLite 数据库，文件位于 `instance/site.db`
- JWT Token 有效期为7天
- 跨域已默认开启（CORS）
- 密码目前为明文存储，生产环境建议加密

## 数据库调试

查看数据库内容：
```bash
python scripts/dump_db.py
```

## 服务器部署（阿里云）

### 部署文件说明

项目包含以下部署相关文件：

| 文件 | 说明 |
|------|------|
| `deploy.sh` | 一键部署脚本，在服务器上执行即可完成全部部署 |
| `DEPLOY.md` | 详细的部署说明文档，包含步骤详解和故障排查 |

### 方式一：一键部署脚本（推荐）

1. 将项目上传到阿里云服务器
2. 进入项目目录，执行部署脚本：

```bash
chmod +x deploy.sh
./deploy.sh
```

脚本会自动完成：
- 安装系统依赖（Python、Nginx 等）
- 创建虚拟环境并安装依赖
- 初始化数据库
- 配置 Systemd 服务（开机自启）
- 配置 Nginx 反向代理
- 启动所有服务

3. 配置邮件：

```bash
# 修改邮件配置
nano /opt/timeplanserver/.env
```

### 方式二：手动部署

详见 [DEPLOY.md](./DEPLOY.md) 文件，包含详细的部署步骤和故障排查。

---

## 注意事项

1. 邮件功能需要正确配置 SMTP 服务器和授权码
2. 定时任务仅在应用运行期间有效
3. 生产环境部署建议使用 Gunicorn 或 uWSGI
4. 阿里云部署需要配置安全组规则开放 80 和 5000 端口
