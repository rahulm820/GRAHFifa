# ─────────────────────────────────────────────────────────────────────────────
# stats_tools.py — FunctionTools for the Stats Agent
# Provides player and team statistics from football-data.org
# ─────────────────────────────────────────────────────────────────────────────
import asyncio
from services.football_api import fetch_scorers, fetch_standings


def get_player_stats(player_name: str) -> dict:
    """
    Get statistics for a specific player in the FIFA World Cup 2026.
    Searches the tournament scorers list for the player.

    Args:
        player_name: The player's name (or partial name) to search for

    Returns:
        Dictionary with player goals, assists, team, and matches played
    """
    try:
        data = asyncio.run(fetch_scorers(limit=50))
        scorers = data.get("scorers", [])

        search = player_name.lower()
        results = []

        for s in scorers:
            player = s.get("player", {})
            name = player.get("name", "")
            if search in name.lower():
                results.append({
                    "name": name,
                    "team": s.get("team", {}).get("name"),
                    "goals": s.get("goals", 0),
                    "assists": s.get("assists", 0),
                    "penalties": s.get("penalties", 0),
                    "played_matches": s.get("playedMatches", 0),
                    "nationality": player.get("nationality"),
                    "position": player.get("position"),
                    "date_of_birth": player.get("dateOfBirth"),
                })

        if results:
            return {"status": "success", "players": results, "count": len(results)}
        else:
            return {
                "status": "not_found",
                "message": f"Player '{player_name}' not found in the tournament scorers list. "
                           f"They may not have scored or assisted yet.",
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def get_team_stats(team_name: str) -> dict:
    """
    Get statistics for a specific team in the FIFA World Cup 2026.
    Includes standings position, wins, draws, losses, goals, and points.

    Args:
        team_name: The team's name (or partial name) to search for

    Returns:
        Dictionary with team standings, form, goals for/against, and points
    """
    try:
        data = asyncio.run(fetch_standings())
        standings = data.get("standings", [])

        search = team_name.lower()
        results = []

        for group in standings:
            group_name = group.get("group", group.get("stage", ""))
            table = group.get("table", [])

            for entry in table:
                team = entry.get("team", {})
                name = team.get("name", "")
                short_name = team.get("shortName", "")
                tla = team.get("tla", "")

                if search in name.lower() or search in short_name.lower() or search in tla.lower():
                    results.append({
                        "team": name,
                        "short_name": short_name,
                        "tla": tla,
                        "group": group_name,
                        "position": entry.get("position"),
                        "played": entry.get("playedGames", 0),
                        "won": entry.get("won", 0),
                        "draw": entry.get("draw", 0),
                        "lost": entry.get("lost", 0),
                        "goals_for": entry.get("goalsFor", 0),
                        "goals_against": entry.get("goalsAgainst", 0),
                        "goal_difference": entry.get("goalDifference", 0),
                        "points": entry.get("points", 0),
                        "form": entry.get("form"),
                    })

        if results:
            return {"status": "success", "teams": results, "count": len(results)}
        else:
            return {
                "status": "not_found",
                "message": f"Team '{team_name}' not found in the standings.",
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}
