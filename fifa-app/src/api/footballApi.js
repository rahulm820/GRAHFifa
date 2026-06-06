// ─────────────────────────────────────────────────────────────────────────────
// footballApi.js — Clean API wrapper for football-data.org v4
// Direct calls from the React Native app for match listing
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://api.football-data.org/v4';
const API_KEY  = process.env.EXPO_PUBLIC_FOOTBALL_API_KEY;
const WC_ID    = 2000; // FIFA World Cup 2026

async function apiFetch(path) {
  if (!API_KEY) throw new Error('EXPO_PUBLIC_FOOTBALL_API_KEY not set in .env');
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (res.status === 429) throw new Error('Rate limit reached. Try again shortly.');
  if (res.status === 403) throw new Error('API key invalid or access denied.');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Fetch matches filtered by status.
 * @param {'LIVE'|'FINISHED'|'SCHEDULED'|'IN_PLAY,PAUSED'} status
 */
export async function fetchMatches(status = 'SCHEDULED') {
  // Map tab status to API statuses
  const statusMap = {
    LIVE: 'IN_PLAY,PAUSED,EXTRA_TIME,PENALTY_SHOOTOUT',
    FINISHED: 'FINISHED',
    SCHEDULED: 'SCHEDULED,TIMED',
  };
  const apiStatus = statusMap[status] || status;
  const data = await apiFetch(`/competitions/${WC_ID}/matches?status=${apiStatus}`);
  return data.matches || [];
}

/**
 * Fetch full match details by ID.
 */
export async function fetchMatchById(matchId) {
  return apiFetch(`/matches/${matchId}`);
}

/**
 * Fetch competition standings.
 */
export async function fetchStandings() {
  return apiFetch(`/competitions/${WC_ID}/standings`);
}

/**
 * Fetch top scorers.
 */
export async function fetchScorers(limit = 10) {
  return apiFetch(`/competitions/${WC_ID}/scorers?limit=${limit}`);
}
