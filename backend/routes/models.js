import express from "express";

const router = express.Router();

// 获取模型列表
router.get('/', async (req, res) => {
    try {
        // 常见的OpenAI兼容模型列表
        const models = [
            {
                id: "gpt-4o",
                name: "GPT-4o",
                description: "OpenAI的最新旗舰模型，支持多模态输入",
                capabilities: ["text", "vision", "audio"],
                max_tokens: 128000,
                context_window: 128000
            },
            {
                id: "gpt-4o-mini",
                name: "GPT-4o Mini",
                description: "GPT-4o的轻量级版本，性价比更高",
                capabilities: ["text", "vision", "audio"],
                max_tokens: 128000,
                context_window: 128000
            },
            {
                id: "gpt-4-turbo",
                name: "GPT-4 Turbo",
                description: "GPT-4的优化版本，响应更快",
                capabilities: ["text"],
                max_tokens: 128000,
                context_window: 128000
            },
            {
                id: "gpt-3.5-turbo",
                name: "GPT-3.5 Turbo",
                description: "快速且经济的模型，适合一般任务",
                capabilities: ["text"],
                max_tokens: 16385,
                context_window: 16385
            },
            {
                id: "claude-3-opus",
                name: "Claude 3 Opus",
                description: "Anthropic的最强模型，擅长复杂推理",
                capabilities: ["text"],
                max_tokens: 200000,
                context_window: 200000
            },
            {
                id: "claude-3-sonnet",
                name: "Claude 3 Sonnet",
                description: "Anthropic的平衡模型，性价比优秀",
                capabilities: ["text"],
                max_tokens: 200000,
                context_window: 200000
            },
            {
                id: "claude-3-haiku",
                name: "Claude 3 Haiku",
                description: "Anthropic的最快模型，适合简单任务",
                capabilities: ["text"],
                max_tokens: 200000,
                context_window: 200000
            },
            {
                id: "gemini-pro",
                name: "Gemini Pro",
                description: "Google的通用AI模型",
                capabilities: ["text"],
                max_tokens: 32768,
                context_window: 32768
            },
            {
                id: "llama-3-70b",
                name: "Llama 3 70B",
                description: "Meta的开源大语言模型",
                capabilities: ["text"],
                max_tokens: 8192,
                context_window: 8192
            },
            {
                id: "llama-3-8b",
                name: "Llama 3 8B",
                description: "Meta的轻量级开源模型",
                capabilities: ["text"],
                max_tokens: 8192,
                context_window: 8192
            }
        ];
        
        res.json({
            models,
            default_model: process.env.OPENAI_MODEL || "gpt-4o"
        });
    } catch (error) {
        console.error('获取模型列表失败:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;