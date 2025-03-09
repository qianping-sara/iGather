import { useState } from 'react';
import { useChatStore } from '../../../store/chatStore';

interface ChatBoxProps {
  className?: string;
}

const ChatBox = ({ className }: ChatBoxProps) => {
  const [message, setMessage] = useState('');
  const { messages, addMessage } = useChatStore();
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // 添加用户消息
    addMessage({
      id: Date.now(),
      sender: 'user',
      content: message,
      timestamp: new Date(),
    });
    
    // 模拟NPC回复
    // 在实际应用中，这可能来自于后端或更复杂的逻辑
    setTimeout(() => {
      const responses = [
        '你好！',
        '这里天气不错！',
        '很高兴认识你！',
        '欢迎来到虚拟空间！',
        '你今天过得怎么样？'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      addMessage({
        id: Date.now() + 1,
        sender: 'npc',
        content: randomResponse,
        timestamp: new Date(),
      });
    }, 1000);
    
    setMessage('');
  };
  
  return (
    <div className={`chat-box ${className || ''}`}>
      <div className="messages bg-gray-800/80 p-4 rounded-lg overflow-y-auto h-72 border border-gray-700">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center py-6">
            <div className="text-[#CC850A] mb-2">👋 欢迎来到聊天</div>
            开始与NPC对话吧！
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message mb-3 p-2 rounded-lg ${
                msg.sender === 'user' 
                  ? 'bg-[#634F7D]/70 text-white self-end ml-12 border-r-2 border-[#634F7D]' 
                  : 'bg-[#CC850A]/30 text-white self-start mr-12 border-l-2 border-[#CC850A]'
              }`}
            >
              <span className={`font-bold text-xs block ${
                msg.sender === 'user' ? 'text-[#634F7D]/90' : 'text-[#CC850A]'
              }`}>
                {msg.sender === 'user' ? '你' : 'NPC'}
              </span>
              <p className="py-1">{msg.content}</p>
              <span className="text-xs opacity-70 block text-right">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
      
      <div className="input-area flex mt-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="输入聊天内容..."
          className="flex-1 p-2 rounded-l-lg bg-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-[#634F7D] border border-gray-600"
        />
        <button 
          onClick={handleSendMessage}
          className="bg-[#634F7D] text-white px-4 py-2 rounded-r-lg hover:bg-[#735F8D] transition border border-[#634F7D]/80"
        >
          发送
        </button>
      </div>
    </div>
  );
};

export default ChatBox; 