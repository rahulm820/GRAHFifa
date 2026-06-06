# ─────────────────────────────────────────────────────────────────────────────
# main.py — FastAPI server for the ADK multi-agent backend
# Endpoints: POST /chat, GET /health
# ─────────────────────────────────────────────────────────────────────────────
import os
import json
import uuid
import asyncio
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from google.adk.runners import InMemoryRunner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part

from agents.root_agent import root_agent

# ─── App State ─────────────────────────────────────────────────────────────────
APP_NAME = "kick-football-agent"
session_service = InMemorySessionService()
runner = InMemoryRunner(agent=root_agent, session_service=session_service)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown."""
    print("🏟️  Kick ADK Server starting...")
    print(f"   Agents: kick (root) → match_agent, stats_agent, tournament_agent")
    print(f"   Model: gemini-2.0-flash")
    yield
    print("🏟️  Kick ADK Server shutting down...")


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


class ChatResponse(BaseModel):
    reply: str
    session_id: str


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

    # Create or reuse session
    session_id = req.session_id or str(uuid.uuid4())
    user_id = "app_user"

    # Try to get existing session, create if not found
    try:
        session = await session_service.get_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id,
        )
    except Exception:
        session = None

    if session is None:
        session = await session_service.create_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id,
        )

    # Build user message with screen context
    message_text = req.message.strip()
    if req.screen_context:
        context_json = json.dumps(req.screen_context, indent=2)
        message_text = f"{message_text}\n\n[SCREEN_CONTEXT]\n{context_json}"

    user_content = Content(
        role="user",
        parts=[Part.from_text(text=message_text)],
    )

    # Run the agent
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


# ─── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
