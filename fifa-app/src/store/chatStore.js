import { create } from 'zustand';

// Use the ADK Server URL, changing http to ws
const HTTP_URL = process.env.EXPO_PUBLIC_ADK_SERVER_URL || 'http://localhost:8000';
const WS_URL = HTTP_URL.replace(/^http/, 'ws') + '/ws/chat';

let ws = null;

export const useChatStore = create((set, get) => ({
  messages: [],
  summary: [],
  connected: false,

  connectWS: (session_id, screen_context) => {
    if (ws) return; // Already connected

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      set({ connected: true });
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'message') {
          set((s) => ({
            messages: [...s.messages, { ...data, reactions: data.reactions || {} }]
          }));
        } else if (data.type === 'reaction') {
          set((s) => ({
            messages: s.messages.map(m => {
              if (m.id === data.messageId) {
                const reactions = { ...m.reactions };
                reactions[data.emoji] = (reactions[data.emoji] || 0) + 1;
                return { ...m, reactions };
              }
              return m;
            })
          }));
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    ws.onclose = () => {
      set({ connected: false });
      ws = null;
      // Reconnect after 3 seconds
      setTimeout(() => get().connectWS(session_id, screen_context), 3000);
    };
  },

  send: (text, user, session_id, screen_context) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        id: String(Date.now()) + Math.floor(Math.random() * 1000),
        user: user?.displayName || 'You',
        photoURL: user?.photoURL || null,
        uid: user?.uid || 'me',
        text,
        time: 'now',
        session_id,
        screen_context,
      }));
    }
  },

  reactToMessage: (messageId, emoji) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'reaction',
        messageId,
        emoji,
      }));
    } else {
      // Optimistic update if offline
      set((s) => ({
        messages: s.messages.map(m => {
          if (m.id === messageId) {
            const reactions = { ...m.reactions };
            reactions[emoji] = (reactions[emoji] || 0) + 1;
            return { ...m, reactions };
          }
          return m;
        })
      }));
    }
  },
}));

