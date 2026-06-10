// ─────────────────────────────────────────────────────────────────────────────
// footballApi.js — API wrapper that routes through ADK backend proxy
// Avoids CORS issues on web by proxying through our FastAPI server
// Falls back to direct calls on native (no CORS restrictions)
// ─────────────────────────────────────────────────────────────────────────────
import { Platform } from 'react-native';

const DIRECT_URL = 'https://api.football-data.org/v4';
const API_KEY    = process.env.EXPO_PUBLIC_FOOTBALL_API_KEY;
const PROXY_URL  = process.env.EXPO_PUBLIC_ADK_SERVER_URL || 'http://localhost:8000';
const WC_ID      = 2000; // FIFA World Cup 2026

// On web → use proxy (CORS), on native → direct is fine
const USE_PROXY = Platform.OS === 'web';

async function directFetch(path) {
  if (!API_KEY) throw new Error('EXPO_PUBLIC_FOOTBALL_API_KEY not set in .env');
  const res = await fetch(`${DIRECT_URL}${path}`, {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (res.status === 429) throw new Error('Rate limit reached. Try again shortly.');
  if (res.status === 403) throw new Error('API key invalid or access denied.');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function proxyFetch(path) {
  const res = await fetch(`${PROXY_URL}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Proxy error (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch matches filtered by status.
 * @param {'LIVE'|'FINISHED'|'SCHEDULED'} status
 */
export async function fetchMatches(status = 'SCHEDULED') {
  const statusMap = {
    LIVE: 'LIVE',
    FINISHED: 'FINISHED',
    SCHEDULED: 'SCHEDULED,TIMED',
  };
  const apiStatus = statusMap[status] || status;

  if (USE_PROXY) {
    const data = await proxyFetch(`/api/matches?status=${apiStatus}`);
    return data.matches || [];
  }

  const data = await directFetch(`/competitions/${WC_ID}/matches?status=${apiStatus}`);
  return data.matches || [];
}

/**
 * Fetch full match details by ID.
 */
export async function fetchMatchById(matchId) {
  if (USE_PROXY) {
    return proxyFetch(`/api/matches/${matchId}`);
  }
  return directFetch(`/matches/${matchId}`);
}

/**
 * Fetch competition standings.
 */
export async function fetchStandings() {
  if (USE_PROXY) {
    return proxyFetch('/api/standings');
  }
  return directFetch(`/competitions/${WC_ID}/standings`);
}

/**
 * Fetch top scorers.
 */
export async function fetchScorers(limit = 10) {
  if (USE_PROXY) {
    return proxyFetch(`/api/scorers?limit=${limit}`);
  }
  return directFetch(`/competitions/${WC_ID}/scorers?limit=${limit}`);
}
