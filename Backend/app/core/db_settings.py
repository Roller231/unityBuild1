from typing import Any, Dict

async def load_game_settings(conn) -> Dict[str, str]:
    rows = await conn.fetch(
        "SELECT name, value FROM game_settings"
    )
    return {row["name"]: row["value"] for row in rows}
