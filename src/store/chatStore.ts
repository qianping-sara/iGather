import { create } from 'zustand';

interface ChatMessage {
  id: number;
  sender: 'user' | 'npc' | string;
  content: string;
  timestamp: Date;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  addMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message].slice(-50) // 只保留最近50条消息
    })),
  clearMessages: () => set({ messages: [] }),
})); 