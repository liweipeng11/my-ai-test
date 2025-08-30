@echo off
echo 正在启动开发环境前后端服务...

echo 启动后端服务...
start cmd /k "cd backend && node index.js"

echo 启动前端服务...
start cmd /k "cd frontend && npm run dev"

echo 开发环境服务启动完成！
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:3000