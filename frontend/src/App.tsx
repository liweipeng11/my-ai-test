import { useState, useEffect } from 'react'
import { message } from 'antd'
import axios from 'axios'
import { Sidebar, MainContent } from './components'
import './App.css'
import './markdown.css'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  }
});

// 消息类型定义
interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  reasoning?: string;
  timestamp: number;
}

// 对话类型定义
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

function App() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [models, setModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [loadingModels, setLoadingModels] = useState(false)
  const [isReasoningMode, setIsReasoningMode] = useState(false)

  // 加载对话列表和模型列表
  useEffect(() => {
    fetchConversations();
    fetchModels();
  }, [])

  // 获取模型列表
  const fetchModels = async () => {
    try {
      setLoadingModels(true);
      const response = await api.get('/models');
      setModels(response.data.models);
      // 设置默认模型为第一个模型或环境默认模型
      if (response.data.models.length > 0) {
        setSelectedModel(response.data.default_model || response.data.models[0].id);
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
      message.error('获取模型列表失败');
    } finally {
      setLoadingModels(false);
    }
  }

  // 获取对话列表
  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await api.get('/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('获取对话列表失败:', error);
      message.error('获取对话列表失败');
    } finally {
      setLoadingConversations(false);
    }
  }

  // 加载特定对话
  const loadConversation = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/conversations/${id}`);
      setMessages(response.data.messages);
      setCurrentConversationId(id);
    } catch (error) {
      console.error('加载对话失败:', error);
      message.error('加载对话失败');
    } finally {
      setLoading(false);
    }
  }

  // 创建新对话
  const createNewConversation = async () => {
    try {
      setLoading(true);
      const response = await api.post('/conversations', { title: '' });

      setCurrentConversationId(response.data.id);
      setMessages([]);
      await fetchConversations();
      console.log('创建新对话成功:', response.data);
    } catch (error) {
      console.error('创建对话失败:', error);
      message.error('创建对话失败');
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // 重命名对话
  const renameConversation = async (id: string, newTitle: string) => {
    if (!id || !newTitle.trim()) return;

    try {
      await api.put(`/conversations/${id}`, { title: newTitle });
      await fetchConversations();
      message.success('对话已重命名');
    } catch (error) {
      console.error('重命名对话失败:', error);
      message.error('重命名对话失败');
      throw error;
    }
  }

  // 删除对话
  const deleteConversation = async (id: string) => {
    if (!id) {
      console.error('删除对话失败: ID为空');
      message.error('删除对话失败: ID为空');
      return;
    }

    try {
      console.log('删除对话:', id);

      await api.delete(`/conversations/${id}`);

      console.log('删除对话成功');

      if (id === currentConversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }

      await fetchConversations();
      message.success('对话已删除');
    } catch (error) {
      console.error('删除对话失败:', error);
      message.error('删除对话失败');
    }
  }

  const handleSend = async () => {
    if (!text.trim() || loading) return;

    let conversationId = currentConversationId;

    // 如果没有当前对话，创建一个新对话
    if (!conversationId) {
      try {
        setLoading(true);
        const response = await api.post('/conversations', { title: '' });

        conversationId = response.data.id;
        setCurrentConversationId(conversationId);
        setMessages([]);
        await fetchConversations();
        console.log('创建新对话成功:', response.data);
      } catch (error) {
        console.error('创建对话失败:', error);
        message.error('创建对话失败，请重试');
        setLoading(false);
        return;
      }
    }

    // 清空输入框
    const userInput = text;
    setText('');

    try {
      if (!loading) setLoading(true);

      // 添加用户消息
      const userMessageId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: userMessageId,
        role: 'user',
        content: userInput,
        timestamp: Date.now()
      }]);

      // 创建AI消息占位
      const aiMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: 'ai',
        content: '',
        reasoning: '',
        timestamp: Date.now()
      }]);

      // 强制React立即更新状态，确保消息被创建
      await new Promise(resolve => setTimeout(resolve, 0));

      console.log('发送请求到后端:', {
        text: userInput,
        conversationId: conversationId,
        messagesCount: messages.length
      });

      // 使用fetch API处理流式响应
      const controller = new AbortController();
      const signal = controller.signal;

      let titleUpdated = false;

      await fetch(`${api.defaults.baseURL}/ai/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: userInput,
          conversationId: conversationId,
          previousMessages: messages,
          model: selectedModel,
          isReasoningMode: isReasoningMode
        }),
        signal
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('ReadableStream not supported');
        }

        const decoder = new TextDecoder();
        let buffer = '';


        function processText(text: string): void {
          buffer += text;
          const lines = buffer.split('\n\n');

          // 保留最后一个可能不完整的行
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                console.log('收到 [DONE] 信号');
                setLoading(false);
                continue;
              }

              // 处理可能的事件合并情况
              const events = data.split('data: ');
              for (const eventData of events) {
                if (!eventData.trim()) continue;

                try {
                  console.log('解析数据:', eventData);
                  const parsed = JSON.parse(eventData);

                  // 处理标题更新事件
                  if (parsed.type === 'title_update') {

                    console.log('收到标题更新:', parsed.title);
                    titleUpdated = true;
                    // 立即刷新对话列表以显示新标题
                    setTimeout(() => {
                      fetchConversations();
                    },1000)

                    continue;
                  }

                  if (parsed.content) {
                    console.log('收到内容:', parsed.content);
                    setMessages(prev => {
                      const updated = [...prev];
                      const aiMessageIndex = updated.findIndex(msg => msg.id === aiMessageId);
                      if (aiMessageIndex >= 0) {
                        updated[aiMessageIndex] = {
                          ...updated[aiMessageIndex],
                          content: (updated[aiMessageIndex].content || '') + parsed.content
                        };
                      }
                      return updated;
                    });
                  }

                  if (parsed.reasoning) {
                    console.log('收到推理:', parsed.reasoning);
                    setMessages(prev => {
                      const updated = [...prev];
                      const aiMessageIndex = updated.findIndex(msg => msg.id === aiMessageId);
                      if (aiMessageIndex >= 0) {
                        updated[aiMessageIndex] = {
                          ...updated[aiMessageIndex],
                          reasoning: (updated[aiMessageIndex].reasoning || '') + parsed.reasoning
                        };
                      }
                      return updated;
                    });
                  }
                } catch (e) {
                  console.error('解析响应数据失败:', e, '原始数据:', eventData);
                }
              }
            }
          }
        }

        function pump(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              console.log('流读取完成');
              return;
            }

            const text = decoder.decode(value, { stream: true });
            processText(text);
            return pump();
          });
        }

        return pump();
      })
        .catch(error => {
          console.error('请求失败:', error);
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'ai',
              content: '请求失败，请重试',
              timestamp: Date.now()
            }
          ]);
          setLoading(false);
        });

      console.log('请求完成');

      // 如果没有收到标题更新事件，再刷新对话列表
      if (!titleUpdated) {
        await fetchConversations();
      }

      // 如果当前对话有更新，重新加载当前对话以获取最新消息
      if (currentConversationId) {
        await loadConversation(currentConversationId);
      }
    } catch (error) {
      console.error('请求失败:', error)
      // 错误已经在fetch的catch块中处理了，这里不需要重复添加错误消息
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        loadingConversations={loadingConversations}
        loading={loading}
        onCreateNewConversation={createNewConversation}
        onLoadConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        onRenameConversation={renameConversation}
      />

      <MainContent
        messages={messages}
        conversations={conversations}
        currentConversationId={currentConversationId}
        text={text}
        loading={loading}
        models={models}
        selectedModel={selectedModel}
        isReasoningMode={isReasoningMode}
        onTextChange={setText}
        onSend={handleSend}
        onModelChange={setSelectedModel}
        onReasoningModeChange={(value) => {
          console.log('设置深度思考模式:', value);
          setIsReasoningMode(value);
        }}
      />
    </div>
  );
}

export default App;