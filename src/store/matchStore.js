import { create } from 'zustand';
import { fetchCompetitionMatches, fetchMatchById, fetchAllLiveMatches, MOCK_DATA } from '../data/realData';

const POLL_MS = 30_000; // 30 s — within free-tier 10 req/min limit

// Statuses that indicate a live/in-progress match
const ACTIVE_STATUSES = ['LIVE', 'HT', 'ET', 'PEN', 'BREAK'];

export const useMatchStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────────
  isLoading:       true,
  error:           null,
  usingMock:       false,

  // Match picker
  liveMatches:     [],        // multiple simultaneous live matches
  selectedMatchId: null,

  // Current display — starts empty; populated by init() from real API
  status:          'LOADING', // LOADING | IDLE | LIVE | HT | ET | PEN | BREAK | UPCOMING | FT | POSTPONED
  match:           null,
  homeSquad:       [],
  awaySquad:       [],
  events:          [],
  stats:           [],
  upcomingMatches: [],        // next 8 upcoming matches
  finishedMatches: [],        // recent finished matches

  // Computed-like getter: true when any live match exists
  isLive: false,

  _pollTimer: null,

  // ── init ─────────────────────────────────────────────────────────────────────
  // Called once from LiveScreen on mount
  init: async () => {
    set({ isLoading: true, error: null });
    try {
      const { live, upcoming, finished } = await fetchCompetitionMatches();

      if (live.length === 1) {
        // One live match — load it directly
        set({ liveMatches: live, isLive: true, finishedMatches: finished.slice(-10).reverse() });
        await get().selectMatch(live[0].id);
        return;
      }

      if (live.length > 1) {
        // Multiple — show picker
        set({
          liveMatches: live, status: 'LIVE', selectedMatchId: null,
          isLoading: false, isLive: true,
          finishedMatches: finished.slice(-10).reverse(),
        });
        return;
      }

      // No live matches — show IDLE hub with both upcoming + finished
      const hasUpcoming = upcoming.length > 0;
      const hasFinished = finished.length > 0;

      set({
        status: 'IDLE',
        upcomingMatches: upcoming.slice(0, 8),
        finishedMatches: finished.slice(-10).reverse(),
        match: hasUpcoming ? upcoming[0] : (hasFinished ? finished[finished.length - 1] : null),
        isLoading: false,
        isLive: false,
        usingMock: false,
      });

      // If nothing at all from API — fall back to mock
      if (!hasUpcoming && !hasFinished) {
        get()._useMock('No World Cup matches found yet.');
      }
    } catch (e) {
      console.warn('[matchStore] init error:', e.message);
      get()._useMock(e.message);
    }
  },

  // ── selectMatch ───────────────────────────────────────────────────────────────
  selectMatch: async (matchId) => {
    set({ isLoading: true, selectedMatchId: matchId, error: null });
    try {
      const { match, events, stats } = await fetchMatchById(matchId);

      // Use real lineup if available — no mock fallback
      const homeSquad = match.home.lineup.length ? match.home.lineup : [];
      const awaySquad = match.away.lineup.length ? match.away.lineup : [];

      set({
        match, events, stats, homeSquad, awaySquad,
        status: match.status, isLoading: false, usingMock: false,
        isLive: ACTIVE_STATUSES.includes(match.status),
      });

      if (ACTIVE_STATUSES.includes(match.status)) {
        get().startPolling();
      }
    } catch (e) {
      set({ isLoading: false, error: e.message });
    }
  },

  // ── Polling ───────────────────────────────────────────────────────────────────
  refreshMatch: async () => {
    const { selectedMatchId } = get();
    if (!selectedMatchId) return;
    try {
      const { match, events, stats } = await fetchMatchById(selectedMatchId);
      const homeSquad = match.home.lineup.length ? match.home.lineup : get().homeSquad;
      const awaySquad = match.away.lineup.length ? match.away.lineup : get().awaySquad;
      set({
        match, events, stats, homeSquad, awaySquad, status: match.status,
        isLive: ACTIVE_STATUSES.includes(match.status),
      });
      if (match.status === 'FT') get().stopPolling();
    } catch (e) {
      console.warn('[matchStore] refresh error:', e.message);
    }
  },

  startPolling: () => {
    get().stopPolling();
    const timer = setInterval(() => get().refreshMatch(), POLL_MS);
    set({ _pollTimer: timer });
  },

  stopPolling: () => {
    const { _pollTimer } = get();
    if (_pollTimer) { clearInterval(_pollTimer); set({ _pollTimer: null }); }
  },

  // Back to match picker / hub
  goBack: () => {
    get().stopPolling();
    set({
      selectedMatchId: null,
      status: get().liveMatches.length > 1 ? 'LIVE' : 'IDLE',
    });
  },

  // ── Internal: fall back to mock data ────────────────────────────────────────
  _useMock: (reason) => {
    console.warn('[matchStore] using mock data:', reason);
    set({
      status: 'LIVE',
      match:     MOCK_DATA.match,
      homeSquad: MOCK_DATA.homeSquad,
      awaySquad: MOCK_DATA.awaySquad,
      events:    MOCK_DATA.events,
      stats:     MOCK_DATA.stats,
      isLoading: false,
      usingMock: true,
      isLive: true,
      error: null,
    });
  },
}));
