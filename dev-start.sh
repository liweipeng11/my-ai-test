#!/bin/bash

echo "正在启动开发环境前后端服务..."

# 启动后端服务
echo "启动后端服务..."
gnome-terminal --tab --title="后端服务" -- bash -c "cd backend && node index.js; exec bash" &

# 启动前端服务
echo "启动前端服务..."
gnome-terminal --tab --title="前端服务" -- bash -c "cd frontend && npm run dev; exec bash" &

echo "开发环境服务启动完成！"
echo "前端地址: http://localhost:5173"
echo "后端地址: http://localhost:3000"