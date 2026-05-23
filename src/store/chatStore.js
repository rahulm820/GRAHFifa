import { create } from 'zustand';
import { chatMessages, aiSummary } from '../data/mockData';
export const useChatStore = create((set) => ({
  messages: chatMessages,
  summary: aiSummary,
  send: (text) => set((s) => ({
    messages: [...s.messages, { id: String(Date.now()), user: 'You', text, time: 'now', mine: true, reactions: {} }],
  })),
}));
