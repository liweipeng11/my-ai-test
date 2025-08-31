import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建数据目录
const DATA_DIR = path.join(__dirname, "..", "data");
const CONVERSATIONS_DIR = path.join(DATA_DIR, "conversations");

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(CONVERSATIONS_DIR)) {
  fs.mkdirSync(CONVERSATIONS_DIR);
}

// 获取所有对话列表
router.get('/', (req, res) => {
    try {
        const files = fs.readdirSync(CONVERSATIONS_DIR);
        const conversations = files
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(CONVERSATIONS_DIR, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                return {
                    id: path.basename(file, '.json'),
                    title: data.title || '未命名对话',
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                };
            })
            .sort((a, b) => b.updatedAt - a.updatedAt);
        
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取单个对话详情
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '对话不存在' });
        }
        
        const conversation = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 创建新对话
router.post('/', (req, res) => {
    try {
        const id = Date.now().toString();
        const conversation = {
            id,
            title: req.body.title || '新对话',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(conversation, null, 2));
        
        res.status(201).json(conversation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 更新对话（添加消息或修改标题）
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '对话不存在' });
        }
        
        const conversation = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // 更新标题
        if (req.body.title) {
            conversation.title = req.body.title;
        }
        
        // 添加消息
        if (req.body.message) {
            conversation.messages.push({
                ...req.body.message,
                timestamp: Date.now()
            });
        }
        
        conversation.updatedAt = Date.now();
        
        fs.writeFileSync(filePath, JSON.stringify(conversation, null, 2));
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 删除对话
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        console.log('收到删除对话请求:', id);
        
        if (!id) {
            console.error('删除对话失败: ID为空');
            return res.status(400).json({ error: 'ID为空' });
        }
        
        // 确保目录存在
        if (!fs.existsSync(CONVERSATIONS_DIR)) {
            console.log('对话目录不存在，创建目录');
            fs.mkdirSync(CONVERSATIONS_DIR, { recursive: true });
        }
        
        const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);
        console.log('对话文件路径:', filePath);
        
        // 检查文件是否存在
        if (fs.existsSync(filePath)) {
            console.log('文件存在，准备删除');
            fs.unlinkSync(filePath);
            console.log('对话文件已删除:', filePath);
            return res.status(200).json({ success: true, message: '对话已删除' });
        } else {
            console.log('对话文件不存在:', filePath);
            return res.status(404).json({ error: '对话不存在' });
        }
    } catch (error) {
        console.error('删除对话失败:', error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;