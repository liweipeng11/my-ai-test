@echo off
echo 正在启动前后端服务...

echo 启动后端服务...
start cmd /k "cd backend && npm start"

echo 启动前端服务...
start cmd /k "cd frontend && npm run dev"

echo 服务启动完成！
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:3000
