import { useRef, useEffect } from 'react'
import { Input } from 'antd'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

const { TextArea } = Input;

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

interface MainContentProps {
  messages: Message[];
  conversations: Conversation[];
  currentConversationId: string | null;
  text: string;
  loading: boolean;
  onTextChange: (value: string) => void;
  onSend: () => void;
}

export default function MainContent({
  messages,
  conversations,
  currentConversationId,
  text,
  loading,
  onTextChange,
  onSend
}: MainContentProps) {
  const resultRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const copyToClipboard = (content: string, reasoning?: string) => {
    const fullContent = reasoning 
      ? `思考过程:\n${reasoning}\n\n回答:\n${content}` 
      : content;
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
  };

  return (
    <div className="main-content">
      <div className="chat-header">
        {currentConversationId ? 
          conversations.find(c => c.id === currentConversationId)?.title || '新对话' 
          : '新对话'}
      </div>
      
      <div className="chat-messages" ref={resultRef}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h2>👋 欢迎来到AI助手！</h2>
            <p>有什么我可以帮你的吗？</p>
          </div>
        )}
        
        {messages.map((message) => (
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
                      onClick={() => copyToClipboard(message.content, message.reasoning)}
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
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="发送消息..."
            autoSize={{ minRows: 1, maxRows: 6 }}
            disabled={loading}
          />
          <button 
            className="send-button" 
            onClick={onSend}
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
  );
}