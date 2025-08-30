import { useState, useRef, useEffect } from 'react'
import { Input, Button, Spin, Modal, message } from 'antd'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import axios from 'axios'
import './App.css'
import './markdown.css'

const { TextArea } = Input;

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
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    console.log(messages,'messages')
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight
    }
  }, [messages])

  // 加载对话列表
  useEffect(() => {
    fetchConversations();
  }, [])

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
      const response = await api.post('/conversations', { title: '新对话' });
      
      setCurrentConversationId(response.data.id);
      setMessages([]);
      await fetchConversations();
      console.log('创建新对话成功:', response.data);
      return response.data.id;
    } catch (error) {
      console.error('创建对话失败:', error);
      message.error('创建对话失败');
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // 重命名对话
  const renameConversation = async () => {
    if (!currentConversationId || !newTitle.trim()) return;
    
    try {
      await api.put(`/conversations/${currentConversationId}`, { title: newTitle });
      
      await fetchConversations();
      setIsRenameModalVisible(false);
      setNewTitle('');
      message.success('对话已重命名');
    } catch (error) {
      console.error('重命名对话失败:', error);
      message.error('重命名对话失败');
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

  const buttonClick = async () => {
    if (!text.trim() || loading) return;
    
    let conversationId = currentConversationId;
    
    // 如果没有当前对话，创建一个新对话
    if (!conversationId) {
      try {
        setLoading(true);
        const response = await api.post('/conversations', { title: '新对话' });
        
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
    
    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // 清空输入框
    const userInput = text;
    setText('');
    
    try {
      if (!loading) setLoading(true);
      
      // 先添加用户消息
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
      
      fetch(`${api.defaults.baseURL}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: userInput,
          conversationId: conversationId,
          previousMessages: messages
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
              
              try {
                console.log('解析数据:', data);
                const parsed = JSON.parse(data);
                
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
                console.error('解析响应数据失败:', e, '原始数据:', data);
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
      
      // 空的响应对象，实际处理在fetch中
      const response = {};
      
      console.log('请求完成');
      
      
      // 只更新对话列表，不重新加载当前对话
      // 这样可以保留流式接收过程中更新的消息状态
      await fetchConversations();
    } catch (error) {
      console.error('请求失败:', error)
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now().toString(), 
          role: 'ai', 
          content: '请求失败，请重试', 
          timestamp: Date.now() 
        }
      ]);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      {/* 侧边栏 */}
      <div className="sidebar">
        <div className="sidebar-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2>AI助手</h2>
        </div>
        
        <button 
          className="new-chat-button"
          onClick={async () => {
            try {
              const newId = await createNewConversation();
              if (newId) {
                setCurrentConversationId(newId);
                setMessages([]);
              }
            } catch (error) {
              console.error('创建新对话失败:', error);
            }
          }}
          disabled={loading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          开启新对话
        </button>
        
        <div className="chat-history">
          {loadingConversations ? (
            <div className="loading-conversations">
              <Spin size="small" /> 加载对话历史...
            </div>
          ) : conversations.length === 0 ? (
            <div className="no-conversations">
              暂无对话历史
            </div>
          ) : (
            conversations.map(conversation => (
              <div 
                key={conversation.id} 
                className={`chat-item ${currentConversationId === conversation.id ? 'active' : ''}`}
                onClick={() => loadConversation(conversation.id)}
              >
                <div className="chat-item-title">{conversation.title}</div>
                <div className="chat-item-actions">
                  <button 
                    className="chat-item-action" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentConversationId(conversation.id);
                      setNewTitle(conversation.title);
                      setIsRenameModalVisible(true);
                    }}
                    title="重命名"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button 
                    className="chat-item-action" 
                    onClick={(e) => {
                      e.stopPropagation();
                      const convId = conversation.id;
                      console.log('点击删除按钮, ID:', convId);
                      
                      if (!convId) {
                        console.error('对话ID为空');
                        message.error('无法删除：对话ID为空');
                        return;
                      }
                      
                      Modal.confirm({
                        title: '确认删除',
                        content: `确定要删除对话 "${conversation.title}" 吗？此操作不可撤销。`,
                        okText: '删除',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: () => {
                          console.log('确认删除对话, ID:', convId);
                          deleteConversation(convId);
                        }
                      });
                    }}
                    title="删除"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="sidebar-footer">
          <span>AI助手 v1.0</span>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="main-content">
        <div className="chat-header">
          {currentConversationId ? 
            conversations.find(c => c.id === currentConversationId)?.title || '新对话' 
            : '新对话'}
        </div>
        
        {/* 重命名对话模态框 */}
        <Modal
          title="重命名对话"
          open={isRenameModalVisible}
          onOk={renameConversation}
          onCancel={() => setIsRenameModalVisible(false)}
          okText="确认"
          cancelText="取消"
        >
          <Input 
            value={newTitle} 
            onChange={(e) => setNewTitle(e.target.value)} 
            placeholder="请输入对话标题"
            maxLength={50}
          />
        </Modal>
        
        <div className="chat-messages" ref={resultRef}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <h2>👋 欢迎来到AI助手！</h2>
              <p>有什么我可以帮你的吗？</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={message.id} className={`message message-${message.role} fade-in`}>
              {message.role === 'user' && (
                <div className="message-content markdown-content">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
              
              {message.role === 'ai' && (
                <>
                  {loading && !message.content && !message.reasoning && (
                    <div className="message-content">
                      <div className="thinking-indicator">
                        思考中
                        <div className="thinking-dots">
                          <div className="thinking-dot"></div>
                          <div className="thinking-dot"></div>
                          <div className="thinking-dot"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {message.reasoning && (
                    <div className="message-reasoning">
                      <div className="reasoning-header">
                        <span>思考过程</span>
                      </div>
                      <div className="reasoning-content markdown-content">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]} 
                          rehypePlugins={[rehypeRaw, rehypeSanitize]}
                        >
                          {message.reasoning}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  {message.content && (
                    <div className="message-content markdown-content">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]} 
                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  
                  {(message.content || message.reasoning) && (
                    <div className="message-actions">
                      <button 
                        className="message-action-button"
                        onClick={() => {
                          const fullContent = message.reasoning 
                            ? `思考过程:\n${message.reasoning}\n\n回答:\n${message.content}` 
                            : message.content;
                          navigator.clipboard.writeText(fullContent);
                          // 显示复制成功提示
                          const tooltip = document.createElement('div');
                          tooltip.textContent = '已复制到剪贴板';
                          tooltip.style.position = 'absolute';
                          tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                          tooltip.style.color = 'white';
                          tooltip.style.padding = '5px 10px';
                          tooltip.style.borderRadius = '4px';
                          tooltip.style.fontSize = '12px';
                          tooltip.style.zIndex = '1000';
                          tooltip.style.top = '-30px';
                          tooltip.style.left = '0';
                          
                          const button = document.activeElement as HTMLElement;
                          button.style.position = 'relative';
                          button.appendChild(tooltip);
                          
                          setTimeout(() => {
                            button.removeChild(tooltip);
                          }, 2000);
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button className="message-action-button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V13C2 12.4696 2.21071 11.9609 2.58579 11.5858C2.96086 11.2107 3.46957 11 4 11H7M14 9V5C14 4.20435 13.6839 3.44129 13.1213 2.87868C12.5587 2.31607 11.7956 2 11 2L7 11V22H18.28C18.7623 22.0055 19.2304 21.8364 19.5979 21.524C19.9654 21.2116 20.2077 20.7769 20.28 20.3L21.66 11.3C21.7035 11.0134 21.6842 10.7207 21.6033 10.4423C21.5225 10.1638 21.3821 9.90629 21.1919 9.68751C21.0016 9.46873 20.7661 9.29393 20.5016 9.17522C20.2371 9.0565 19.9499 8.99672 19.66 9H14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button className="message-action-button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 2H20C20.5304 2 21.0391 2.21071 21.4142 2.58579C21.7893 2.96086 22 3.46957 22 4V11C22 11.5304 21.7893 12.0391 21.4142 12.4142C21.0391 12.7893 20.5304 13 20 13H17M10 15V19C10 19.7956 10.3161 20.5587 10.8787 21.1213C11.4413 21.6839 12.2044 22 13 22L17 13V2H5.72C5.23765 1.99448 4.76961 2.16359 4.40205 2.47599C4.03449 2.78839 3.79218 3.22309 3.72 3.7L2.34 12.7C2.29651 12.9866 2.31583 13.2793 2.39666 13.5577C2.4775 13.8362 2.61788 14.0937 2.80812 14.3125C2.99837 14.5313 3.23387 14.7061 3.49834 14.8248C3.76281 14.9435 4.05009 15.0033 4.34 15H10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        
        <div className="chat-input-container">
          <div className="model-selector">
            <span className="model-selector-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="model-name">默认模型</span>
            <span className="model-selector-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
          
          <div className="chat-input-wrapper">
            <TextArea
              className="chat-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  buttonClick();
                }
              }}
              placeholder="发送消息..."
              autoSize={{ minRows: 1, maxRows: 6 }}
              disabled={loading}
            />
            <button 
              className="send-button" 
              onClick={buttonClick}
              disabled={!text.trim() || loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="footer-info">
            内容由 AI 生成，请勿轻信
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;