import { create } from 'zustand';
import { useMatchStore } from './matchStore';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are the FIFA World Cup 2026 AI Assistant — an expert on everything related to the 2026 FIFA World Cup being held in the USA, Mexico, and Canada.

Your capabilities:
- Answer questions about match schedules, results, team rosters, group standings, and tournament rules
- Provide tactical analysis and player comparisons
- Share stadium information, venue details, and fan travel tips
- Explain VAR decisions, offside rules, and other football regulations
- Provide historical World Cup facts and records

Guidelines:
- Be concise but informative — keep responses under 200 words unless the user asks for detail
- Use football emoji sparingly for flair ⚽🏆
- If you have live match context, reference it naturally
- If you don't know something, say so honestly
- Always be enthusiastic about football!`;

function getMatchContext() {
  const state = useMatchStore.getState();
  if (!state.match) return '';

  const m = state.match;
  const isActive = ['LIVE', 'HT', 'ET', 'PEN', 'BREAK'].includes(state.status);

  let ctx = `\n\nCURRENT MATCH CONTEXT:\n`;
  ctx += `${m.home?.flag} ${m.home?.name} ${m.home?.score ?? '?'} — ${m.away?.score ?? '?'} ${m.away?.name} ${m.away?.flag}\n`;
  ctx += `Status: ${state.status}`;
  if (isActive && m.minute) ctx += ` (${m.minute}')`;
  ctx += `\nCompetition: ${m.competition || 'FIFA World Cup 2026'}`;
  if (m.venue && m.venue !== 'TBD') ctx += `\nVenue: ${m.venue}`;
  if (m.htScore) ctx += `\nHT Score: ${m.htScore}`;
  if (m.etScore) ctx += `\nET Score: ${m.etScore}`;
  if (m.penScore) ctx += `\nPenalty Score: ${m.penScore}`;

  if (state.events?.length > 0) {
    ctx += `\n\nKey Events:\n`;
    state.events.filter(e => !['halftime','fulltime'].includes(e.type)).slice(-6).forEach(e => {
      ctx += `- ${e.minute}' ${e.type.toUpperCase()}: ${e.player || ''} ${e.desc || ''}\n`;
    });
  }

  if (state.stats?.length > 0) {
    ctx += `\nMatch Stats:\n`;
    state.stats.slice(0, 5).forEach(s => {
      ctx += `- ${s.label}: ${m.home?.name} ${s.home}${s.unit || ''} vs ${m.away?.name} ${s.away}${s.unit || ''}\n`;
    });
  }

  return ctx;
}

export const useGeminiStore = create((set, get) => ({
  messages: [],       // { id, role: 'user'|'assistant', text, timestamp }
  isLoading: false,
  error: null,
  isOpen: false,

  toggleChat: () => set(s => ({ isOpen: !s.isOpen })),
  openChat:   () => set({ isOpen: true }),
  closeChat:  () => set({ isOpen: false }),

  clearMessages: () => set({ messages: [], error: null }),

  sendMessage: async (text) => {
    if (!text.trim()) return;
    if (!GEMINI_API_KEY) {
      set({ error: 'EXPO_PUBLIC_GEMINI_API_KEY not set in .env' });
      return;
    }

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
      const history = get().messages;
      const matchContext = getMatchContext();

      // Build Gemini API request with conversation history
      const contents = [];

      // Add conversation history
      history.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      });

      const body = {
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT + matchContext }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        },
      };

      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.';

      const aiMsg = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        text: aiText,
        timestamp: new Date().toISOString(),
      };

      set(s => ({
        messages: [...s.messages, aiMsg],
        isLoading: false,
      }));
    } catch (e) {
      console.warn('[geminiStore] API error:', e.message);
      const errorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        text: `⚠️ Error: ${e.message}. Please try again.`,
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
