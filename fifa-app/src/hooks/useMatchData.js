// ─────────────────────────────────────────────────────────────────────────────
// useMatchData.js — React hook for tab-based match data fetching
// Polls live matches every 30s, caches finished/upcoming
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchMatches } from '../api/footballApi';
import { mapMatch } from '../utils/matchUtils';

const POLL_INTERVAL = 30_000; // 30s for live tab

/**
 * @param {'LIVE'|'FINISHED'|'SCHEDULED'} activeTab
 */
export function useMatchData(activeTab) {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasLive, setHasLive] = useState(false);
  const pollRef = useRef(null);
  const cacheRef = useRef({ FINISHED: null, SCHEDULED: null });

  const loadMatches = useCallback(async (tab, force = false) => {
    // Use cache for non-live tabs unless forced
    if (!force && tab !== 'LIVE' && cacheRef.current[tab]) {
      setMatches(cacheRef.current[tab]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const raw = await fetchMatches(tab);
      const mapped = raw.map(mapMatch);

      // Sort: finished → most recent first, upcoming → soonest first
      if (tab === 'FINISHED') {
        mapped.sort((a, b) => new Date(b.date) - new Date(a.date));
      } else if (tab === 'SCHEDULED') {
        mapped.sort((a, b) => new Date(a.date) - new Date(b.date));
      }

      setMatches(mapped);

      // Cache non-live results
      if (tab !== 'LIVE') {
        cacheRef.current[tab] = mapped;
      }

      // Check if any live matches exist (for badge)
      if (tab === 'LIVE') {
        setHasLive(mapped.length > 0);
      }
    } catch (e) {
      console.warn('[useMatchData] error:', e.message);
      setError(e.message);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on tab change
  useEffect(() => {
    loadMatches(activeTab);

    // Poll only for live tab
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeTab === 'LIVE') {
      pollRef.current = setInterval(() => loadMatches('LIVE'), POLL_INTERVAL);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeTab, loadMatches]);

  // Also check for live matches in the background (for tab badge)
  useEffect(() => {
    const checkLive = async () => {
      try {
        const raw = await fetchMatches('LIVE');
        setHasLive(raw.length > 0);
      } catch { /* ignore */ }
    };
    if (activeTab !== 'LIVE') checkLive();
  }, [activeTab]);

  const refresh = useCallback(() => loadMatches(activeTab, true), [activeTab, loadMatches]);

  return { matches, isLoading, error, hasLive, refresh };
}
