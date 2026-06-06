// ─────────────────────────────────────────────────────────────────────────────
// matchStore.js — Simplified store for match state
// Manages isLive flag, screenContext for Gemini agent
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { fetchMatches } from '../api/footballApi';

export const useMatchStore = create((set, get) => ({
  // Is any live match happening? (for tab badge + capsule)
  isLive: false,

  // Screen context for Gemini agent
  screenContext: {
    current_tab: 'LIVE',
    selected_match: null,
  },

  // Quick live match info for the capsule
  liveMatch: null,

  // Update screen context (called by LiveScreen)
  setScreenContext: (ctx) => set({ screenContext: ctx }),

  // Check for live matches (for capsule + tab badge)
  checkLive: async () => {
    try {
      const raw = await fetchMatches('LIVE');
      const matches = raw || [];
      if (matches.length > 0) {
        const m = matches[0];
        set({
          isLive: true,
          liveMatch: {
            id: m.id,
            home: { code: m.homeTeam?.tla, score: m.score?.fullTime?.home ?? 0 },
            away: { code: m.awayTeam?.tla, score: m.score?.fullTime?.away ?? 0 },
            minute: m.minute,
            status: m.status,
          },
        });
      } else {
        set({ isLive: false, liveMatch: null });
      }
    } catch {
      // Silent fail
    }
  },
}));
