import { useState } from 'react'
import { Spin, Modal, Input, message } from 'antd'

// 对话类型定义
interface Conversation {
  id: string;
  title: string;
  messages: any[];
  createdAt: number;
  updatedAt: number;
}

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  loadingConversations: boolean;
  loading: boolean;
  onCreateNewConversation: () => Promise<void>;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => Promise<void>;
}

export default function Sidebar({
  conversations,
  currentConversationId,
  loadingConversations,
  loading,
  onCreateNewConversation,
  onLoadConversation,
  onDeleteConversation,
  onRenameConversation
}: SidebarProps) {
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<{id: string, title: string} | null>(null)
  const [conversationToRename, setConversationToRename] = useState<string | null>(null)

  const handleRename = async () => {
    if (!conversationToRename || !newTitle.trim()) return;
    
    try {
      await onRenameConversation(conversationToRename, newTitle);
      setIsRenameModalVisible(false);
      setNewTitle('');
      setConversationToRename(null);
    } catch (error) {
      console.error('重命名失败:', error);
    }
  }

  const handleDelete = () => {
    if (conversationToDelete) {
      console.log('确认删除对话, ID:', conversationToDelete.id);
      onDeleteConversation(conversationToDelete.id);
      setDeleteModalVisible(false);
      setConversationToDelete(null);
    }
  }

  return (
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
        onClick={onCreateNewConversation}
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
              onClick={() => onLoadConversation(conversation.id)}
            >
              <div className="chat-item-title">
                {conversation.title && conversation.title !== '新对话' && conversation.title !== '未命名对话' 
                  ? conversation.title 
                  : '新对话'}
              </div>
              <div className="chat-item-actions">
                <button 
                  className="chat-item-action" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setConversationToRename(conversation.id);
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
                    
                    setConversationToDelete({id: convId, title: conversation.title});
                    setDeleteModalVisible(true);
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

      {/* 重命名对话模态框 */}
      <Modal
        title="重命名对话"
        open={isRenameModalVisible}
        onOk={handleRename}
        onCancel={() => {
          setIsRenameModalVisible(false);
          setNewTitle('');
          setConversationToRename(null);
        }}
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

      {/* 删除对话确认模态框 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setConversationToDelete(null);
        }}
        okText="删除"
        okType="danger"
        cancelText="取消"
      >
        {conversationToDelete && (
          <p>确定要删除对话 "{conversationToDelete.title}" 吗？此操作不可撤销。</p>
        )}
      </Modal>
    </div>
  );
}