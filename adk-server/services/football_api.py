# ─────────────────────────────────────────────────────────────────────────────
# football_api.py — Async football-data.org v4 API wrapper
# Used by all agent tools to fetch live match data
# ─────────────────────────────────────────────────────────────────────────────
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://api.football-data.org/v4"
API_KEY = os.getenv("FOOTBALL_DATA_API_KEY", "")
WC_ID = 2000  # FIFA World Cup 2026

# Reusable async client
_client = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            base_url=BASE_URL,
            headers={"X-Auth-Token": API_KEY},
            timeout=15.0,
        )
    return _client


async def _fetch(path: str) -> dict:
    """Core fetch with error handling."""
    if not API_KEY:
        raise ValueError("FOOTBALL_DATA_API_KEY not set in .env")
    client = _get_client()
    res = await client.get(path)
    if res.status_code == 429:
        raise Exception("Rate limit reached (10 req/min). Try again shortly.")
    if res.status_code == 403:
        raise Exception("API key invalid or access denied.")
    res.raise_for_status()
    return res.json()


# ─── Public API Functions ──────────────────────────────────────────────────────

async def fetch_matches(status: str = "SCHEDULED") -> dict:
    """
    Fetch matches filtered by status.
    status: SCHEDULED | LIVE | IN_PLAY | PAUSED | FINISHED | POSTPONED | CANCELLED
    """
    return await _fetch(f"/competitions/{WC_ID}/matches?status={status}")


async def fetch_match_by_id(match_id: int) -> dict:
    """Fetch full match details including lineup, events, stats."""
    return await _fetch(f"/matches/{match_id}")


async def fetch_standings() -> dict:
    """Fetch competition standings (group tables / knockout bracket)."""
    return await _fetch(f"/competitions/{WC_ID}/standings")


async def fetch_scorers(limit: int = 10) -> dict:
    """Fetch top scorers for the competition."""
    return await _fetch(f"/competitions/{WC_ID}/scorers?limit={limit}")


async def fetch_team(team_id: int) -> dict:
    """Fetch team details."""
    return await _fetch(f"/teams/{team_id}")


async def fetch_competition_info() -> dict:
    """Fetch competition metadata (dates, teams, etc.)."""
    return await _fetch(f"/competitions/{WC_ID}")
