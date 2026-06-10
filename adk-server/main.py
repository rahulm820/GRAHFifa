# ─────────────────────────────────────────────────────────────────────────────
# main.py — FastAPI server for the ADK multi-agent backend
# Endpoints: POST /chat, GET /health, /api/* proxy
# ─────────────────────────────────────────────────────────────────────────────
import os
import json
import uuid
import asyncio
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from google.adk.runners import InMemoryRunner
from google.genai.types import Content, Part

from agents.root_agent import root_agent

# ─── App State ─────────────────────────────────────────────────────────────────
APP_NAME = "kick-football-agent"
runner = InMemoryRunner(agent=root_agent, app_name=APP_NAME)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown."""
    print("[Kick] ADK Server starting...")
    print("   Agents: kick (root) -> match_agent, stats_agent, tournament_agent")
    print("   Model: gemini-2.0-flash")
    yield
    print("[Kick] ADK Server shutting down...")


app = FastAPI(
    title="Kick — FIFA WC 2026 Agent",
    description="Multi-agent football assistant powered by Google ADK + Gemini",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Models ────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    screen_context: Optional[dict] = None
    user_name: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str


# ─── WebSocket Connection Manager ──────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()


# ─── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "app": APP_NAME,
        "agents": ["kick", "match_agent", "stats_agent", "tournament_agent"],
        "model": "gemini-2.0-flash",
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a message to the Kick agent and get a response."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Session ID: reuse or generate
    session_id = req.session_id or str(uuid.uuid4())
    user_id = "app_user"

    message_text = req.message.strip()
    if req.user_name:
        message_text = f"My name is {req.user_name}.\n\n{message_text}"
        
    if req.screen_context:
        context_json = json.dumps(req.screen_context, indent=2)
        message_text = f"{message_text}\n\n[SCREEN_CONTEXT]\n{context_json}"

    user_content = Content(
        role="user",
        parts=[Part.from_text(text=message_text)],
    )

    # Run the agent (InMemoryRunner auto-creates sessions)
    final_reply = ""
    try:
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=user_content,
        ):
            # Collect the final text response from the agent
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if hasattr(part, "text") and part.text:
                        # Only take the last agent response (not tool calls)
                        if event.author == "kick" or not event.author:
                            final_reply = part.text
    except Exception as e:
        print(f"[ERROR] Agent execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    if not final_reply:
        final_reply = "I couldn't process that request. Try asking about a match, player, or the tournament! ⚽"

    return ChatResponse(reply=final_reply, session_id=session_id)


@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            # Handle reactions
            if data.get("type") == "reaction":
                await manager.broadcast(data)
                continue
                
            # Handle messages
            if data.get("type") == "message":
                user_msg = data.get("text", "")
                user_name = data.get("user", "User")
                msg_id = data.get("id", str(uuid.uuid4()))
                
                # Broadcast the user's message immediately
                await manager.broadcast({
                    "type": "message",
                    "id": msg_id,
                    "user": user_name,
                    "text": user_msg,
                    "uid": data.get("uid", ""),
                    "photoURL": data.get("photoURL", ""),
                    "time": data.get("time", "now"),
                })
                
                # Process agent response in background to not block socket
                async def process_agent_message(req_data):
                    session_id = req_data.get("session_id", "public-chat")
                    screen_context = req_data.get("screen_context")
                    message_text = user_msg.strip()
                    
                    if screen_context:
                        context_json = json.dumps(screen_context, indent=2)
                        message_text = f"{message_text}\n\n[SCREEN_CONTEXT]\n{context_json}"
                        
                    user_content = Content(
                        role="user",
                        parts=[Part.from_text(text=message_text)],
                    )
                    
                    final_reply = ""
                    try:
                        async for event in runner.run_async(
                            user_id="app_user",
                            session_id=session_id,
                            new_message=user_content,
                        ):
                            if event.content and event.content.parts:
                                for part in event.content.parts:
                                    if hasattr(part, "text") and part.text:
                                        if event.author == "kick" or not event.author:
                                            final_reply = part.text
                    except Exception as e:
                        print(f"[ERROR] Agent execution failed: {e}")
                        final_reply = "Sorry, I ran into an error processing that."
                        
                    if not final_reply:
                        final_reply = "I couldn't process that request. Try asking about a match, player, or the tournament! ⚽"
                        
                    # Broadcast agent response
                    await manager.broadcast({
                        "type": "message",
                        "id": str(uuid.uuid4()),
                        "user": "Kick Bot",
                        "text": final_reply,
                        "uid": "kick-bot",
                        "photoURL": "https://ui-avatars.com/api/?name=K&background=4285F4&color=fff",
                        "time": "now",
                    })
                
                asyncio.create_task(process_agent_message(data))

    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ─── Football Data Proxy (bypasses CORS for web) ──────────────────────────────
from services.football_api import (
    fetch_matches, fetch_match_by_id, fetch_standings, fetch_scorers, fetch_competition_info
)


@app.get("/api/matches")
async def proxy_matches(status: str = "SCHEDULED"):
    """Proxy: fetch matches by status."""
    try:
        data = await fetch_matches(status)
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/matches/{match_id}")
async def proxy_match_by_id(match_id: int):
    """Proxy: fetch single match details."""
    try:
        data = await fetch_match_by_id(match_id)
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/standings")
async def proxy_standings():
    """Proxy: fetch competition standings."""
    try:
        data = await fetch_standings()
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/scorers")
async def proxy_scorers(limit: int = 10):
    """Proxy: fetch top scorers."""
    try:
        data = await fetch_scorers(limit=limit)
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/competition")
async def proxy_competition():
    """Proxy: fetch competition info."""
    try:
        data = await fetch_competition_info()
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ─── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

