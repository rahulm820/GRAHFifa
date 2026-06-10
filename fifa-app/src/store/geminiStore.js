// ─────────────────────────────────────────────────────────────────────────────
// geminiStore.js — Chat store that calls the ADK backend
// Replaces direct Gemini API calls with POST /chat to adk-server
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { useMatchStore } from './matchStore';
import { useAuthStore } from './authStore';

const ADK_SERVER_URL = process.env.EXPO_PUBLIC_ADK_SERVER_URL || 'http://localhost:8000';

export const useGeminiStore = create((set, get) => ({
  messages: [],        // { id, role: 'user'|'assistant', text, timestamp }
  isLoading: false,
  error: null,
  isOpen: false,
  sessionId: null,     // ADK session ID for conversation continuity

  toggleChat: () => set(s => ({ isOpen: !s.isOpen })),
  openChat:   () => set({ isOpen: true }),
  closeChat:  () => set({ isOpen: false }),

  clearMessages: () => set({ messages: [], error: null, sessionId: null }),

  sendMessage: async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    set(s => ({
      messages: [...s.messages, userMsg],
      isLoading: true,
      error: null,
    }));

    try {
      // Get screen context from matchStore
      const screenContext = useMatchStore.getState().screenContext;
      const user = useAuthStore.getState().user;

      const body = {
        message: text.trim(),
        session_id: get().sessionId,
        screen_context: screenContext,
        user_name: user?.displayName || 'User',
      };

      const res = await fetch(`${ADK_SERVER_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Server error (${res.status})`);
      }

      const data = await res.json();

      const aiMsg = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        text: data.reply || 'Sorry, I couldn\'t generate a response.',
        timestamp: new Date().toISOString(),
      };

      set(s => ({
        messages: [...s.messages, aiMsg],
        isLoading: false,
        sessionId: data.session_id || s.sessionId,
      }));
    } catch (e) {
      console.warn('[geminiStore] ADK error:', e.message);

      let errorText = `⚠️ ${e.message}`;
      if (e.message.includes('Network') || e.message.includes('fetch')) {
        errorText = '⚠️ Cannot reach the Kick server. Make sure adk-server is running on ' + ADK_SERVER_URL;
      }

      const errorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        text: errorText,
        timestamp: new Date().toISOString(),
      };

      set(s => ({
        messages: [...s.messages, errorMsg],
        isLoading: false,
        error: e.message,
      }));
    }
  },
}));
