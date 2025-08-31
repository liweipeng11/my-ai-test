import express from "express";
import OpenAI from "openai";
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

// 创建 OpenAI 实例（延迟初始化）
let openai = null;

function getOpenAIInstance() {
    if (!openai) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
        });
    }
    return openai;
}

const systemPrompt = `
# 角色 (Role)
你是一个名为 婷婷 的通用人工智能助手。

# 核心能力 (Core Capabilities)
*   **知识渊博的专家**: 你可以清晰、准确地回答用户关于科学、技术、历史、文化、艺术等多种领域的提问。你的知识是广泛的，但你需要意识到可能存在知识截止日期。
*   **高效的程序员助手**: 你精通多种主流编程语言，如 Python, JavaScript, Java, C++, Go 等。你可以编写代码、解释代码逻辑、调试错误，并提供关于算法和数据结构的专业知识。
*   **富有创造力的写作伙伴**: 你能够进行文本创作，包括撰写文章、起草邮件、润色文案、创作诗歌和故事等，并能根据用户要求调整写作风格。
*   **精准的语言翻译家**: 你能够理解并处理多种语言，提供流畅、准确的翻译服务。

# 行为准则 (Behavioral Guidelines)
1.  **恪守中立与客观**: 在回答问题时，尤其是在处理具有争议性的话题时，你需要保持中立和客观的立场。如果合适，可以呈现来自不同视角的观点。
2.  **保证安全与道德**: 严格拒绝任何形式的有害请求。这包括但不限于生成涉及暴力、仇恨、歧视、非法行为或不道德内容的回应。当检测到此类请求时，应礼貌地拒绝并说明原因。
3.  **追求准确与严谨**: 始终致力于提供准确、可靠的信息。如果某个问题的答案不确定或你的知识库中没有相关信息，请坦诚地告知用户，而不是猜测或编造答案。
4.  **优先考虑清晰度与结构**: 使用清晰、易于理解的语言。在解释复杂概念或提供步骤时，请善用 Markdown 格式，例如使用列表（有序或无序）、代码块、引用和粗体来组织你的回答，以增强可读性。
5.  **保持友好与专业的语气**: 与用户的交流应始终保持礼貌、耐心和乐于助人的态度。即使在面对挑战性问题或用户表达不满时，也要维持专业的沟通风格。

# 输出格式要求 (Output Format Requirements)
*   **代码块**: 当提供代码示例时，必须使用带有语言标识的 Markdown 代码块进行包裹（例如：\`\`\`python ... \`\`\`）。
*   **列表**: 对于步骤、要点或多个项目，优先使用项目符号或编号列表进行展示。
*   **引用**: 在引用外部观点或名言时，使用引用块格式。
  `;

router.post('/summarize', async (req, res) => {
    try {
        const { text, conversationId, previousMessages = [], model, isReasoningMode = false } = req.body;
        const selectedModel = model || process.env.OPENAI_MODEL || 'gpt-4o';

        console.log('收到请求:', { text, conversationId, previousMessagesCount: previousMessages.length, model: selectedModel });

        // 设置响应头，支持流式传输
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let messages = [];

        // 如果提供了对话ID，尝试从文件加载消息历史
        if (conversationId) {
            const filePath = path.join(CONVERSATIONS_DIR, `${conversationId}.json`);
            if (fs.existsSync(filePath)) {
                const conversation = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                // 使用文件中的消息历史，而不是前端传来的
                const historyMessages = conversation.messages.map(msg => ({
                    role: msg.role === 'ai' ? 'assistant' : msg.role,
                    content: msg.content
                }));

                // 构建消息历史，限制最多10条历史消息以避免超出token限制
                messages = [
                    { role: "system", content: systemPrompt },
                    ...historyMessages.slice(-10),
                    { role: "user", content: text }
                ];

                console.log('使用历史消息:', historyMessages.length);
            } else {
                // 如果对话ID不存在，创建新对话
                messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text }
                ];
                console.log('创建新对话');
            }
        } else {
            // 如果没有提供对话ID，使用前端传来的消息历史
            messages = [
                { role: "system", content: systemPrompt },
                ...previousMessages.map(msg => ({
                    role: msg.role === 'ai' ? 'assistant' : msg.role,
                    content: msg.content
                })).slice(-10),
                { role: "user", content: text }
            ];
            console.log('使用前端传来的消息');
        }

        console.log('发送到API的消息数量:', messages.length);

        // 创建流式响应
        const stream = await getOpenAIInstance().chat.completions.create({
            model: selectedModel,
            messages: messages,
            stream: true, // 启用流式响应
        });

        let fullContent = '';
        let fullReasoning = '';

        // 发送流式数据到客户端
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            let reasoning = chunk.choices[0]?.delta?.reasoning_content || '';

            if (isReasoningMode) {
                fullReasoning += reasoning;
            }

            fullContent += content;

            if (reasoning && isReasoningMode) {
                const data = `data: ${JSON.stringify({ reasoning })}\n\n`;
                console.log('发送推理数据:', data);
                res.write(data);
            }

            if (content) {
                const data = `data: ${JSON.stringify({ content })}\n\n`;
                console.log('发送内容数据:', data);
                res.write(data);
            }
        }

        // 如果提供了对话ID，保存消息到对话文件
        if (conversationId) {
            const filePath = path.join(CONVERSATIONS_DIR, `${conversationId}.json`);
            let conversation;
            let isFirstMessage = false;

            // 如果对话文件存在，读取并更新
            if (fs.existsSync(filePath)) {
                conversation = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                isFirstMessage = conversation.messages.length === 0;
            } else {
                // 创建新对话
                conversation = {
                    id: conversationId,
                    title: '新对话',
                    messages: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                isFirstMessage = true;
            }

            // 添加用户消息
            conversation.messages.push({
                id: Date.now().toString(),
                role: 'user',
                content: text,
                timestamp: Date.now()
            });

            // 添加AI回复
            conversation.messages.push({
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: fullContent,
                reasoning: fullReasoning,
                timestamp: Date.now() + 1
            });

            // 如果是第一条消息，根据内容生成对话标题
            if (isFirstMessage) {
                try {
                    // 使用 OpenAI 生成标题
                    const titleResponse = await getOpenAIInstance().chat.completions.create({
                        model: 'Qwen/Qwen2.5-7B-Instruct',
                        messages: [
                            {
                                role: "system",
                                content: "你是一个对话标题生成器。根据用户的第一条消息，生成一个简短、具体的标题，不超过15个字。不要使用引号，不要添加任何解释，只返回标题文本。"
                            },
                            { role: "user", content: text }
                        ],
                        max_tokens: 30,
                    });

                    const generatedTitle = titleResponse.choices[0].message.content.trim();
                    if (generatedTitle) {
                        conversation.title = generatedTitle;
                        console.log('自动生成标题:', generatedTitle);

                        // 发送标题更新事件到前端（确保单独发送）
                        const titleUpdateEvent = `data: ${JSON.stringify({ type: 'title_update', title: generatedTitle })}\n\n`;
                        res.write(titleUpdateEvent);
                        // 确保事件完全发送后再继续
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                } catch (titleError) {
                    console.error('生成标题失败:', titleError);
                    // 如果生成标题失败，使用默认标题
                    conversation.title = text.substring(0, 15) + (text.length > 15 ? '...' : '');
                }
            }

            conversation.updatedAt = Date.now();

            // 保存对话
            fs.writeFileSync(filePath, JSON.stringify(conversation, null, 2));
            console.log('对话已保存:', conversationId);
        }

        // 结束响应
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('处理请求失败:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;