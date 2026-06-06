# ─────────────────────────────────────────────────────────────────────────────
# tournament_tools.py — FunctionTools for the Tournament Agent
# Provides standings, top scorers, and tournament metadata
# ─────────────────────────────────────────────────────────────────────────────
import asyncio
from services.football_api import fetch_standings, fetch_scorers, fetch_competition_info


def get_standings() -> dict:
    """
    Get the full FIFA World Cup 2026 standings including all group tables
    or knockout bracket results.

    Returns:
        Dictionary with group tables showing position, team, points, W/D/L, and goal difference
    """
    try:
        data = asyncio.run(fetch_standings())
        standings = data.get("standings", [])

        groups = []
        for group in standings:
            group_name = group.get("group", group.get("stage", ""))
            table = []
            for entry in group.get("table", []):
                team = entry.get("team", {})
                table.append({
                    "position": entry.get("position"),
                    "team": team.get("name"),
                    "tla": team.get("tla"),
                    "played": entry.get("playedGames", 0),
                    "won": entry.get("won", 0),
                    "draw": entry.get("draw", 0),
                    "lost": entry.get("lost", 0),
                    "gf": entry.get("goalsFor", 0),
                    "ga": entry.get("goalsAgainst", 0),
                    "gd": entry.get("goalDifference", 0),
                    "points": entry.get("points", 0),
                    "form": entry.get("form"),
                })
            groups.append({"group": group_name, "table": table})

        return {"status": "success", "groups": groups, "total_groups": len(groups)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def get_top_scorers(limit: int = 10) -> dict:
    """
    Get the top scorers in the FIFA World Cup 2026.

    Args:
        limit: Number of top scorers to return (default: 10, max: 50)

    Returns:
        Dictionary with ranked list of top scorers including goals, assists, and team
    """
    try:
        if limit > 50:
            limit = 50
        data = asyncio.run(fetch_scorers(limit=limit))
        scorers = data.get("scorers", [])

        result = []
        for i, s in enumerate(scorers, 1):
            player = s.get("player", {})
            result.append({
                "rank": i,
                "player": player.get("name"),
                "team": s.get("team", {}).get("name"),
                "goals": s.get("goals", 0),
                "assists": s.get("assists", 0),
                "penalties": s.get("penalties", 0),
                "played_matches": s.get("playedMatches", 0),
                "nationality": player.get("nationality"),
            })

        return {"status": "success", "scorers": result, "total": len(result)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def get_tournament_info() -> dict:
    """
    Get general information about the FIFA World Cup 2026 tournament
    including dates, host countries, number of teams, and current stage.

    Returns:
        Dictionary with tournament metadata
    """
    try:
        data = asyncio.run(fetch_competition_info())

        season = data.get("currentSeason", {})

        return {
            "status": "success",
            "tournament": {
                "name": data.get("name"),
                "code": data.get("code"),
                "area": data.get("area", {}).get("name"),
                "start_date": season.get("startDate"),
                "end_date": season.get("endDate"),
                "current_matchday": season.get("currentMatchday"),
                "stages": data.get("stages", []),
                "number_of_teams": data.get("numberOfAvailableSeasons"),
                "emblem": data.get("emblem"),
            },
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
