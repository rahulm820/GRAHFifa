import { create } from 'zustand';
import { chatMessages, aiSummary } from '../data/mockData';

export const useChatStore = create((set) => ({
  messages: chatMessages,
  summary: aiSummary,

  /**
   * Send a message from the logged-in user.
   * @param {string} text    - message text
   * @param {object} user    - { displayName, photoURL, uid } from authStore
   */
  send: (text, user) => set((s) => ({
    messages: [
      ...s.messages,
      {
        id: String(Date.now()),
        user: user?.displayName || 'You',
        photoURL: user?.photoURL || null,
        uid: user?.uid || 'me',
        text,
        time: 'now',
        mine: true,
        reactions: {},
      },
    ],
  })),
}));
