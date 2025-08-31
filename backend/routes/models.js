import express from "express";

const router = express.Router();

// 获取模型列表
router.get('/', async (req, res) => {
    try {
        // 支持的模型列表
        const models = [
            { id: "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B", name: "DeepSeek-R1-0528-Qwen3-8B", is_reasoning: true },
            { id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B", name: "DeepSeek-R1-Distill-Qwen-7B", is_reasoning: true },
            { id: "Qwen/Qwen3-8B", name: "Qwen3-8B", is_reasoning: true },
            { id: "Qwen/Qwen2.5-7B-Instruct", name: "Qwen2.5-7B-Instruct", is_reasoning: false },
            { id: "Qwen/Qwen2.5-Coder-7B-Instruct", name: "Qwen2.5-Coder-7B-Instruct", is_reasoning: false },
            { id: "Qwen/Qwen2-7B-Instruct", name: "Qwen2-7B-Instruct", is_reasoning: false },
            { id: "THUDM/GLM-4.1V-9B-Thinking", name: "GLM-4.1V-9B-Thinking", is_reasoning: false },
            { id: "THUDM/GLM-Z1-9B-0414", name: "GLM-Z1-9B-0414", is_reasoning: true },
            { id: "THUDM/GLM-4-9B-0414", name: "GLM-4-9B-0414", is_reasoning: false },
            { id: "THUDM/glm-4-9b-chat", name: "GLM-4-9B-Chat", is_reasoning: false }
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