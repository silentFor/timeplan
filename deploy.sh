#!/bin/bash
set -euo pipefail

# ============================================
# TimePlan 一键部署脚本
# 用法: bash deploy.sh
# ============================================

PROJECT_DIR="/home/admin/project/timeplan"
SERVER_DIR="$PROJECT_DIR/server"
WEB_DIR="$PROJECT_DIR/web"
NGINX_CONTAINER="1Panel-openresty-v5Ma"
BACKEND_PORT=5000

# 解决 Git 目录属主安全限制（root 运行 admin 的仓库时会报错）
git config --global --add safe.directory "$PROJECT_DIR" 2>/dev/null || true

cd "$PROJECT_DIR"

echo "========================================"
echo "[1/7] 正在拉取最新代码..."
echo "========================================"

# 丢弃上次部署留下的本地修改（sed 替换的临时变更）
if ! git checkout -- web/src/ server/app.py 2>/dev/null; then
    echo "没有需要清理的本地修改，继续..."
fi

git pull origin main

echo ""
echo "========================================"
echo "[2/7] 正在应用部署配置..."
echo "========================================"

# 后端：绑定 0.0.0.0:5000
sed -i "s/app.run()/app.run(host='0.0.0.0', port=${BACKEND_PORT})/" server/app.py

# 前端：移除硬编码的本地后端地址
find web/src \( -name "*.jsx" -o -name "*.js" \) -print0 | xargs -0 sed -i 's|http://127.0.0.1:5000||g'

echo ""
echo "========================================"
echo "[3/7] 正在执行数据库迁移..."
echo "========================================"

cd "$SERVER_DIR"
source .venv/bin/activate
flask db upgrade

echo ""
echo "========================================"
echo "[4/7] 正在构建前端..."
echo "========================================"

cd "$WEB_DIR"
npm install
npm run build

echo ""
echo "========================================"
echo "[5/7] 正在部署前端到 Nginx..."
echo "========================================"

sudo docker cp build/. "${NGINX_CONTAINER}:/usr/share/nginx/html/"
sudo docker exec "${NGINX_CONTAINER}" /usr/local/openresty/bin/openresty -s reload

echo ""
echo "========================================"
echo "[6/7] 正在重启后端服务..."
echo "========================================"

sudo systemctl restart timeplan

echo ""
echo "========================================"
echo "[7/7] 等待服务启动并验证接口..."
echo "========================================"

sleep 3

if curl -sSf "http://127.0.0.1:${BACKEND_PORT}/msg/daily_send_email" > /dev/null 2>&1; then
    echo "✅ 接口测试通过，部署成功！"
    curl -s "http://127.0.0.1:${BACKEND_PORT}/msg/daily_send_email"
    echo ""
else
    echo "❌ 接口测试失败，请手动检查服务状态："
    echo "   sudo systemctl status timeplan --no-pager"
    echo "   sudo netstat -tlnp | grep ${BACKEND_PORT}"
    exit 1
fi

echo ""
echo "========================================"
echo "🎉 部署完成"
echo "========================================"
