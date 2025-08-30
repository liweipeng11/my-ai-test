# AI助手项目

这是一个前后端分离的AI助手项目。

## 项目结构

- `frontend/`: 前端React应用
- `backend/`: 后端Express服务

## 使用npm一键启动（推荐）

首次使用前，请先安装依赖：

```bash
npm run install-deps
```

### 生产环境启动

```bash
npm start
```

这将同时启动前端和后端服务，前端使用`npm run dev`，后端使用`npm start`。

### 开发环境启动

```bash
npm run dev
```

这将同时启动前端和后端服务，前端使用`npm run dev`，后端直接使用`node index.js`。

## 使用脚本启动（备选方案）

### 生产环境启动

#### Windows用户

双击运行 `start.bat` 文件即可同时启动前端和后端服务。

#### Linux/Mac用户

1. 首先赋予启动脚本执行权限：
   ```bash
   chmod +x start.sh
   ```

2. 然后运行脚本：
   ```bash
   ./start.sh
   ```

### 开发环境启动

#### Windows用户

双击运行 `dev-start.bat` 文件即可同时启动前端和后端服务。

#### Linux/Mac用户

1. 首先赋予启动脚本执行权限：
   ```bash
   chmod +x dev-start.sh
   ```

2. 然后运行脚本：
   ```bash
   ./dev-start.sh
   ```

## 手动启动

### 启动后端

```bash
cd backend
node index.js
```

### 启动前端

```bash
cd frontend
npm run dev
```

## 访问应用

- 前端地址: http://localhost:5173
- 后端API地址: http://localhost:3000