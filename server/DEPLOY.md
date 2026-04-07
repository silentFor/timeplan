# 阿里云服务器部署指南

## 目录

1. [准备工作](#准备工作)
2. [上传项目](#上传项目)
3. [运行部署脚本](#运行部署脚本)
4. [阿里云配置](#阿里云配置)
5. [验证部署](#验证部署)
6. [日常维护](#日常维护)
7. [故障排查](#故障排查)

---

## 准备工作

### 1. 购买阿里云服务器

- **推荐配置**: 1核2G 或以上
- **操作系统**: Ubuntu 20.04/22.04 LTS 或 CentOS 7/8
- **带宽**: 1Mbps 或以上

### 2. 连接到服务器

```bash
# 使用 SSH 连接（将 IP 替换为你的服务器公网 IP）
ssh root@你的服务器IP

# 示例
ssh root@47.98.123.45
```

### 3. 准备项目文件

**方式一：本地上传（推荐）**

将项目文件夹压缩后上传到服务器：

```bash
# 在本地项目根目录执行
zip -r timeplanserver.zip . -x "venv/*" "__pycache__/*" "*.pyc" "instance/*"

# 上传到服务器（使用 scp 或 FTP 工具）
scp timeplanserver.zip root@你的服务器IP:/root/
```

**方式二：Git 克隆**

如果项目已推送到 GitHub：
```bash
git clone https://github.com/你的用户名/timeplanserver.git
```

---

## 上传项目

### 步骤 1：解压项目（如果是压缩包）

```bash
# 连接到服务器后
ssh root@你的服务器IP

# 解压项目
cd /root
unzip timeplanserver.zip -d timeplanserver
cd timeplanserver

# 查看文件
ls -la
```

你应该能看到以下文件：
```
app.py
deploy.sh
requirements.txt
message/
login/
timeplan/
...
```

---

## 运行部署脚本

### 步骤 1：赋予执行权限

```bash
chmod +x deploy.sh
```

### 步骤 2：运行部署脚本

```bash
./deploy.sh
```

脚本会自动完成以下操作：
- ✅ 更新系统软件包
- ✅ 安装 Python3、pip、git、nginx 等依赖
- ✅ 创建 Python 虚拟环境
- ✅ 安装项目依赖
- ✅ 配置环境变量
- ✅ 初始化数据库
- ✅ 配置 Gunicorn WSGI 服务器
- ✅ 配置 Systemd 服务（开机自启）
- ✅ 配置 Nginx 反向代理
- ✅ 启动所有服务

### 步骤 3：配置邮件（重要）

部署完成后，修改 `.env` 文件中的邮件配置：

```bash
cd /opt/timeplanserver
nano .env
```

修改为实际的邮箱配置：
```
# 邮件配置（使用 QQ 邮箱示例）
SMTP_SERVER=smtp.qq.com
SMTP_PORT=587
SENDER_EMAIL=3128368084@qq.com
EMAIL_PASSWORD=你的授权码
```

**获取 QQ 邮箱授权码**：
1. 登录 QQ 邮箱网页版
2. 设置 → 账户 → 开启 SMTP 服务
3. 获取授权码（不是登录密码）

---

## 阿里云配置

### 1. 配置安全组规则

登录阿里云控制台 → 云服务器 ECS → 安全组 → 配置规则

**入方向需要开放的端口：**

| 端口 | 用途 | 授权对象 |
|------|------|----------|
| 22 | SSH 连接 | 0.0.0.0/0 |
| 80 | HTTP 访问 | 0.0.0.0/0 |
| 443 | HTTPS（可选）| 0.0.0.0/0 |
| 5000 | Flask 应用（可选）| 0.0.0.0/0 |

**添加入方向规则示例：**
```
协议类型: 自定义 TCP
端口范围: 80/80
授权对象: 0.0.0.0/0
描述: HTTP 访问
```

### 2. （可选）配置域名

如果你有域名，可以在阿里云域名解析中添加 A 记录：

```
主机记录: @ 或 www
记录类型: A
记录值: 你的服务器公网 IP
TTL: 600
```

然后在服务器上修改 Nginx 配置：
```bash
nano /etc/nginx/sites-available/timeplanserver
```

将 `server_name _;` 改为你的域名：
```nginx
server_name your-domain.com www.your-domain.com;
```

重启 Nginx：
```bash
systemctl restart nginx
```

---

## 验证部署

### 1. 检查服务状态

```bash
# 查看应用服务状态
systemctl status timeplanserver

# 查看 Nginx 状态
systemctl status nginx
```

### 2. 测试接口

```bash
# 在服务器本地测试
curl http://localhost:5000/msg/daily_send_email

# 或使用公网 IP 测试（将 IP 替换为你的服务器 IP）
curl http://你的服务器IP/msg/daily_send_email
```

### 3. 浏览器访问

在浏览器中打开：
```
http://你的服务器IP/msg/daily_send_email
```

如果看到 `{"data": [], "message": "已发送"}`，说明部署成功！

---

## 日常维护

### 启动/停止/重启服务

```bash
# 启动
systemctl start timeplanserver

# 停止
systemctl stop timeplanserver

# 重启
systemctl restart timeplanserver

# 查看状态
systemctl status timeplanserver
```

### 设置开机自启

```bash
systemctl enable timeplanserver
```

### 查看日志

```bash
# 应用错误日志
tail -f /opt/timeplanserver/logs/error.log

# 应用访问日志
tail -f /opt/timeplanserver/logs/access.log

# 系统服务日志
journalctl -u timeplanserver -f

# 查看最近的 100 条日志
journalctl -u timeplanserver -n 100
```

### 更新代码

```bash
# 进入项目目录
cd /opt/timeplanserver

# 备份当前版本
cp -r . ../timeplanserver.backup.$(date +%Y%m%d)

# 上传新代码（或 git pull）
# ...

# 重启服务
systemctl restart timeplanserver
```

---

## 故障排查

### 问题 1：服务无法启动

**检查步骤：**
```bash
# 查看详细错误
journalctl -u timeplanserver -n 50

# 检查端口是否被占用
netstat -tlnp | grep 5000

# 手动测试启动
cd /opt/timeplanserver
source venv/bin/activate
python app.py
```

### 问题 2：无法访问接口

**检查步骤：**
```bash
# 检查防火墙
ufw status

# 检查安全组（阿里云控制台）

# 检查 Nginx 配置
nginx -t
cat /etc/nginx/sites-available/timeplanserver

# 检查服务是否在监听
netstat -tlnp | grep 5000
```

### 问题 3：邮件发送失败

**检查步骤：**
```bash
# 查看应用日志
tail -f /opt/timeplanserver/logs/error.log

# 检查邮件配置
cat /opt/timeplanserver/.env

# 测试邮件配置（在 Python 中）
source /opt/timeplanserver/venv/bin/activate
python -c "from message.sendmsg import send_email; send_email('测试邮箱', '测试', '测试内容')"
```

### 问题 4：数据库错误

**检查步骤：**
```bash
# 检查数据库文件
ls -la /opt/timeplanserver/instance/

# 重新初始化数据库
cd /opt/timeplanserver
source venv/bin/activate
python create_tables.py
```

---

## 进阶配置

### 配置 HTTPS（使用 Let's Encrypt）

```bash
# 安装 certbot
apt-get install certbot python3-certbot-nginx

# 申请证书（将域名替换为你的域名）
certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期测试
certbot renew --dry-run
```

### 配置自动备份

创建备份脚本：
```bash
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# 备份数据库
cp /opt/timeplanserver/instance/site.db $BACKUP_DIR/

# 备份项目代码
tar -czf $BACKUP_DIR/timeplanserver.tar.gz -C /opt timeplanserver

# 保留最近 7 天的备份
find /opt/backups -type d -mtime +7 -exec rm -rf {} \;
EOF

chmod +x /opt/backup.sh

# 添加到定时任务（每天凌晨 3 点执行）
echo "0 3 * * * /opt/backup.sh" | crontab -
```

---

## 安全建议

1. **修改默认端口**：将 SSH 端口从 22 改为其他端口
2. **禁用 root 登录**：创建普通用户并禁用 root 远程登录
3. **配置防火墙**：只开放必要的端口
4. **定期更新**：定期更新系统和依赖包
5. **使用 HTTPS**：生产环境必须使用 HTTPS

---

## 联系支持

如有问题，请检查日志文件或联系开发人员。
