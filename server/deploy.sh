#!/bin/bash

# =============================================================================
# 日程管理系统部署脚本
# 用于阿里云服务器自动化部署
# =============================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量（可根据需要修改）
PROJECT_NAME="timeplanserver"
PROJECT_DIR="/opt/${PROJECT_NAME}"
PYTHON_VERSION="3.9"
APP_PORT=5000
SERVICE_NAME="${PROJECT_NAME}"

# =============================================================================
# 辅助函数
# =============================================================================

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        return 1
    fi
    return 0
}

# =============================================================================
# 1. 系统环境准备
# =============================================================================

print_info "开始部署 ${PROJECT_NAME}..."
print_info "项目目录: ${PROJECT_DIR}"

# 检查是否为 root 用户
if [[ $EUID -ne 0 ]]; then
   print_error "请使用 root 权限运行此脚本 (sudo ./deploy.sh)"
   exit 1
fi

print_info "更新系统软件包..."
apt-get update -y

# =============================================================================
# 2. 安装基础依赖
# =============================================================================

print_info "安装基础依赖..."
apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libssl-dev \
    libffi-dev \
    git \
    wget \
    curl \
    nginx \
    supervisor

# 检查 Python 版本
print_info "检查 Python 版本..."
python3 --version

# =============================================================================
# 3. 创建项目目录
# =============================================================================

print_info "创建项目目录..."
if [ -d "${PROJECT_DIR}" ]; then
    print_warning "项目目录已存在，将备份旧项目..."
    mv "${PROJECT_DIR}" "${PROJECT_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
fi

mkdir -p "${PROJECT_DIR}"
cd "${PROJECT_DIR}"

# =============================================================================
# 4. 复制项目文件（假设脚本在项目根目录执行）
# =============================================================================

print_info "复制项目文件..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "${SCRIPT_DIR}/app.py" ]; then
    # 脚本在项目目录中执行，复制所有文件
    cp -r "${SCRIPT_DIR}"/* "${PROJECT_DIR}/"
    print_success "项目文件复制完成"
else
    print_error "未找到项目文件，请确保 deploy.sh 在项目根目录"
    print_info "请将整个项目上传到服务器后再运行此脚本"
    exit 1
fi

# =============================================================================
# 5. 创建 Python 虚拟环境
# =============================================================================

print_info "创建 Python 虚拟环境..."
python3 -m venv venv
source venv/bin/activate

# 升级 pip
pip install --upgrade pip

# =============================================================================
# 6. 安装 Python 依赖
# =============================================================================

print_info "安装 Python 依赖..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    pip install gunicorn  # WSGI 服务器
    print_success "依赖安装完成"
else
    print_error "未找到 requirements.txt"
    exit 1
fi

# =============================================================================
# 7. 配置环境变量
# =============================================================================

print_info "配置环境变量..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
# Flask 配置
SECRET_KEY=$(openssl rand -hex 24)
FLASK_ENV=production

# 数据库配置（使用 SQLite）
DATABASE_URI=sqlite:///instance/site.db

# 邮件配置（请修改为你的邮箱配置）
SMTP_SERVER=smtp.qq.com
SMTP_PORT=587
SENDER_EMAIL=your-email@qq.com
EMAIL_PASSWORD=your-auth-code
EOF
    print_warning "已创建默认 .env 文件，请修改其中的邮件配置"
else
    print_info ".env 文件已存在，跳过创建"
fi

# =============================================================================
# 8. 初始化数据库
# =============================================================================

print_info "初始化数据库..."
if [ -f "create_tables.py" ]; then
    python create_tables.py
    print_success "数据库初始化完成"
else
    print_warning "未找到 create_tables.py，跳过数据库初始化"
fi

# =============================================================================
# 9. 创建日志目录
# =============================================================================

print_info "创建日志目录..."
mkdir -p logs
mkdir -p instance

# =============================================================================
# 10. 配置 Gunicorn 启动脚本
# =============================================================================

print_info "创建 Gunicorn 启动脚本..."
cat > start.sh << 'EOF'
#!/bin/bash
# 启动脚本

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${PROJECT_DIR}"

# 激活虚拟环境
source venv/bin/activate

# 获取环境变量
export $(cat .env | grep -v '^#' | xargs)

# 启动 Gunicorn
# 配置说明：
# -w 4: 4个 worker 进程
# -b 0.0.0.0:5000: 监听所有网卡的5000端口
# --access-logfile: 访问日志
# --error-logfile: 错误日志
# --timeout 120: 超时时间120秒
# --reload: 开发环境自动重载（生产环境建议去掉）

gunicorn -w 4 \
    -b 0.0.0.0:5000 \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log \
    --timeout 120 \
    --capture-output \
    --enable-stdio-inheritance \
    "app:app"
EOF

chmod +x start.sh

# =============================================================================
# 11. 配置 Systemd 服务（可选，推荐用于生产环境）
# =============================================================================

print_info "配置 Systemd 服务..."
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=TimePlan Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${PROJECT_DIR}
Environment="PATH=${PROJECT_DIR}/venv/bin"
EnvironmentFile=${PROJECT_DIR}/.env
ExecStart=${PROJECT_DIR}/venv/bin/gunicorn -w 4 -b 0.0.0.0:${APP_PORT} --access-logfile ${PROJECT_DIR}/logs/access.log --error-logfile ${PROJECT_DIR}/logs/error.log --timeout 120 --capture-output --enable-stdio-inheritance "app:app"
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 重新加载 systemd
systemctl daemon-reload

print_success "Systemd 服务配置完成"
print_info "启动命令: systemctl start ${SERVICE_NAME}"
print_info "停止命令: systemctl stop ${SERVICE_NAME}"
print_info "开机自启: systemctl enable ${SERVICE_NAME}"

# =============================================================================
# 12. 配置 Nginx 反向代理（可选）
# =============================================================================

print_info "配置 Nginx..."
cat > /etc/nginx/sites-available/${PROJECT_NAME} << EOF
server {
    listen 80;
    server_name _;  # 监听所有域名，或改为你的域名

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 静态文件（如果有的话）
    location /static {
        alias ${PROJECT_DIR}/static;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/${PROJECT_NAME} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default  # 删除默认站点

# 测试 Nginx 配置
nginx -t

print_success "Nginx 配置完成"

# =============================================================================
# 13. 配置防火墙
# =============================================================================

print_info "配置防火墙..."
if check_command ufw; then
    ufw allow 80/tcp
    ufw allow 5000/tcp
    print_success "UFW 防火墙规则已添加"
fi

# 阿里云安全组需要手动配置，这里给出提示
print_warning "请确保阿里云安全组已开放以下端口："
print_warning "  - 80 (HTTP)"
print_warning "  - 5000 (Flask 应用)"
print_warning "  - 22 (SSH，通常已开放)"

# =============================================================================
# 14. 启动服务
# =============================================================================

print_info "启动服务..."

# 启动 Nginx
systemctl restart nginx
systemctl enable nginx
print_success "Nginx 已启动"

# 启动应用服务
systemctl start ${SERVICE_NAME}
systemctl enable ${SERVICE_NAME}
print_success "应用服务已启动"

# 等待几秒检查服务状态
sleep 3
if systemctl is-active --quiet ${SERVICE_NAME}; then
    print_success "服务运行正常"
else
    print_error "服务启动失败，请检查日志: journalctl -u ${SERVICE_NAME}"
    exit 1
fi

# =============================================================================
# 15. 部署完成
# =============================================================================

echo ""
echo "============================================================================="
echo -e "${GREEN}部署完成！${NC}"
echo "============================================================================="
echo ""
echo -e "${BLUE}项目信息：${NC}"
echo "  项目目录: ${PROJECT_DIR}"
echo "  访问地址: http://$(curl -s ip.sb):${APP_PORT}"
echo "  Nginx 地址: http://$(curl -s ip.sb)"
echo ""
echo -e "${BLUE}常用命令：${NC}"
echo "  查看服务状态: systemctl status ${SERVICE_NAME}"
echo "  重启服务: systemctl restart ${SERVICE_NAME}"
echo "  查看日志: tail -f ${PROJECT_DIR}/logs/error.log"
echo "  查看访问日志: tail -f ${PROJECT_DIR}/logs/access.log"
echo "  应用日志: tail -f ${PROJECT_DIR}/logs/app.log"
echo ""
echo -e "${BLUE}注意事项：${NC}"
echo "  1. 请修改 .env 文件中的邮件配置"
echo "  2. 如果使用域名，请修改 Nginx 配置中的 server_name"
echo "  3. 建议配置 HTTPS (可以使用 certbot)"
echo ""
echo "============================================================================="
