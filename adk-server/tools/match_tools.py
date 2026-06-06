# ─────────────────────────────────────────────────────────────────────────────
# match_tools.py — FunctionTools for the Match Agent
# Provides live match data, summaries, and event timelines
# ─────────────────────────────────────────────────────────────────────────────
import asyncio
from services.football_api import fetch_matches, fetch_match_by_id


async def _fetch_match(match_id: int) -> dict:
    """Internal helper to fetch and format match data."""
    data = await fetch_match_by_id(match_id)
    m = data

    home = m.get("homeTeam", {})
    away = m.get("awayTeam", {})
    score = m.get("score", {})
    ft = score.get("fullTime", {})
    ht = score.get("halfTime", {})
    et = score.get("extraTime", {})
    pen = score.get("penalties", {})

    return {
        "match_id": m.get("id"),
        "status": m.get("status"),
        "minute": m.get("minute"),
        "home_team": home.get("name"),
        "home_tla": home.get("tla"),
        "away_team": away.get("name"),
        "away_tla": away.get("tla"),
        "home_score": ft.get("home"),
        "away_score": ft.get("away"),
        "ht_score": f"{ht.get('home', '-')}–{ht.get('away', '-')}" if ht.get("home") is not None else None,
        "et_score": f"{et.get('home', '-')}–{et.get('away', '-')}" if et.get("home") is not None else None,
        "pen_score": f"{pen.get('home', '-')}–{pen.get('away', '-')}" if pen.get("home") is not None else None,
        "venue": m.get("venue"),
        "competition": m.get("competition", {}).get("name"),
        "stage": m.get("stage"),
        "group": m.get("group"),
        "utc_date": m.get("utcDate"),
        "referees": [r.get("name") for r in m.get("referees", [])],
    }


def get_match_summary(match_id: int) -> dict:
    """
    Get a summary of a specific match including score, status, minute,
    venue, referee, and goalscorers.

    Args:
        match_id: The unique match ID from football-data.org

    Returns:
        Dictionary with match summary including score, status, venue, and goalscorers
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                data = pool.submit(asyncio.run, _fetch_match(match_id)).result()
        else:
            data = asyncio.run(_fetch_match(match_id))

        # Also get events
        raw = asyncio.run(fetch_match_by_id(match_id)) if not loop.is_running() else data
        goals = []
        for g in raw.get("goals", []) if isinstance(raw, dict) else []:
            goals.append({
                "minute": g.get("minute"),
                "scorer": g.get("scorer", {}).get("name"),
                "team": g.get("team", {}).get("name"),
                "type": g.get("type"),
            })

        data["goalscorers"] = goals
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def get_match_events(match_id: int) -> dict:
    """
    Get the full event timeline of a match including goals, cards,
    and substitutions.

    Args:
        match_id: The unique match ID from football-data.org

    Returns:
        Dictionary with lists of goals, bookings, and substitutions
    """
    try:
        data = asyncio.run(fetch_match_by_id(match_id))

        events = []

        # Goals
        for g in data.get("goals", []):
            events.append({
                "minute": g.get("minute"),
                "type": "GOAL",
                "player": g.get("scorer", {}).get("name"),
                "team": g.get("team", {}).get("name"),
                "assist": g.get("assist", {}).get("name") if g.get("assist") else None,
                "goal_type": g.get("type"),
                "score_after": f"{g.get('score', {}).get('home', '?')}–{g.get('score', {}).get('away', '?')}",
            })

        # Cards
        for b in data.get("bookings", []):
            events.append({
                "minute": b.get("minute"),
                "type": b.get("card", "YELLOW"),
                "player": b.get("player", {}).get("name"),
                "team": b.get("team", {}).get("name"),
            })

        # Substitutions
        for s in data.get("substitutions", []):
            events.append({
                "minute": s.get("minute"),
                "type": "SUBSTITUTION",
                "player_in": s.get("playerIn", {}).get("name"),
                "player_out": s.get("playerOut", {}).get("name"),
                "team": s.get("team", {}).get("name"),
            })

        # Sort by minute
        events.sort(key=lambda e: e.get("minute", 0) or 0)

        return {"status": "success", "events": events, "total": len(events)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def get_live_matches() -> dict:
    """
    Get all currently live FIFA World Cup 2026 matches.

    Returns:
        Dictionary with list of live matches including scores and minutes
    """
    try:
        data = asyncio.run(fetch_matches("LIVE"))
        matches = []
        for m in data.get("matches", []):
            home = m.get("homeTeam", {})
            away = m.get("awayTeam", {})
            score = m.get("score", {}).get("fullTime", {})
            matches.append({
                "match_id": m.get("id"),
                "home_team": home.get("name"),
                "away_team": away.get("name"),
                "home_score": score.get("home"),
                "away_score": score.get("away"),
                "minute": m.get("minute"),
                "status": m.get("status"),
                "venue": m.get("venue"),
            })

        return {"status": "success", "matches": matches, "count": len(matches)}
    except Exception as e:
        return {"status": "error", "message": str(e)}
