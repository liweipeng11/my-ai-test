import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// 导入路由模块
import conversationsRouter from "./routes/conversations.js";
import aiRouter from "./routes/ai.js";
import modelsRouter from "./routes/models.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 中间件，允许跨域
app.use(cors());
app.use(express.json()); // 解析 JSON 请求体

// 使用路由模块
app.use('/conversations', conversationsRouter);
app.use('/ai', aiRouter);
app.use('/models', modelsRouter);

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// 根路径重定向到健康检查
app.get('/', (req, res) => {
    res.redirect('/health');
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});