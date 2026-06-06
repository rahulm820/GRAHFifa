# ⚽ FIFA Rapid Agent 2026

A real-time FIFA World Cup 2026 companion app with a multi-agent AI assistant powered by Google ADK + Gemini.

![Architecture](https://img.shields.io/badge/Frontend-React_Native-61DAFB?logo=react)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![AI](https://img.shields.io/badge/AI-Google_ADK-4285F4?logo=google)
![Data](https://img.shields.io/badge/Data-football--data.org-2DB555)

---

## 🏗️ Architecture

```
fifa-rapid-agent-2026/
├── fifa-app/          → React Native (Expo) mobile app
└── adk-server/        → Python ADK multi-agent backend
```

```
┌─────────────────────────────────┐
│     React Native App (Expo)     │
│                                 │
│  LiveScreen ──→ football-data   │
│  Kick Agent ──→ ADK Backend     │
└────────────────┬────────────────┘
                 │ POST /chat
┌────────────────▼────────────────┐
│     ADK Backend (FastAPI)       │
│                                 │
│  🏟️ Kick (Root Agent)           │
│  ├── ⚽ Match Agent             │
│  ├── 📊 Stats Agent            │
│  └── 🏆 Tournament Agent       │
│                                 │
│  All tools → football-data.org  │
└─────────────────────────────────┘
```

---

## 📱 Mobile App (`fifa-app/`)

### Features

| Feature | Description |
|---------|-------------|
| **Live Matches** | Real-time scores, minute-by-minute updates with auto-polling |
| **Match Hub** | Tabbed view — Completed \| Live \| Upcoming |
| **Match Details** | Score panel, events timeline, lineups, formations, stats |
| **Kick AI Chatbot** | Floating ⚽ FAB → chat with a multi-agent football assistant |
| **Live Capsule** | Draggable floating score widget during live matches |
| **Auth** | Firebase Authentication (Email + Google Sign-In) |
| **Dark/Light Theme** | Persistent theme toggle with premium aesthetics |

### Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: React Navigation (Bottom Tabs)
- **State**: Zustand
- **Auth**: Firebase (email + Google OAuth)
- **API**: football-data.org v4
- **AI Backend**: ADK Server (see below)

---

## 🤖 ADK Backend (`adk-server/`)

Multi-agent AI system built with [Google Agent Development Kit (ADK)](https://github.com/google/adk-python).

### Agents

| Agent | Role | Tools |
|-------|------|-------|
| **Kick** (Root) | Orchestrator — routes to sub-agents | `AgentTool(match)`, `AgentTool(stats)`, `AgentTool(tournament)` |
| **Match Agent** | Live scores, events, timeline | `get_match_summary()`, `get_match_events()`, `get_live_matches()` |
| **Stats Agent** | Player & team statistics | `get_player_stats()`, `get_team_stats()` |
| **Tournament Agent** | Standings, top scorers, bracket | `get_standings()`, `get_top_scorers()`, `get_tournament_info()` |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat` | Send a message to Kick → get AI response |
| `GET` | `/health` | Server status + agent list |

### Example Request

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Who are the top scorers?", "session_id": null}'
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **Expo CLI**: `npm install -g expo-cli`
- **API Keys**:
  - [football-data.org](https://www.football-data.org/client/register) (free tier)
  - [Google AI Studio](https://aistudio.google.com/apikey) (Gemini API key)
  - [Firebase Console](https://console.firebase.google.com/) (for auth)

### 1. Clone

```bash
git clone https://github.com/rahulm820/GRAHFifa.git
cd GRAHFifa
```

### 2. Setup ADK Backend

```bash
cd adk-server

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env .env  # Edit with your actual keys:
# GOOGLE_API_KEY=your_gemini_api_key
# FOOTBALL_DATA_API_KEY=your_football_data_key

# Run the server
uvicorn main:app --reload
# → http://localhost:8000
```

### 3. Setup Mobile App

```bash
cd fifa-app

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Firebase config, football-data API key, etc.

# Start Expo dev server
npx expo start --clear
```

### 4. Connect App to Backend

The app defaults to `http://localhost:8000` for the ADK server. If running on a **physical device**, update `EXPO_PUBLIC_ADK_SERVER_URL` in `fifa-app/.env` to your machine's local IP:

```
EXPO_PUBLIC_ADK_SERVER_URL=http://192.168.1.x:8000
```

---

## 📁 Project Structure

```
fifa-rapid-agent-2026/
│
├── adk-server/                    # Python ADK Backend
│   ├── main.py                    # FastAPI server (POST /chat, GET /health)
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # API keys (git-ignored)
│   ├── agents/
│   │   ├── root_agent.py          # "Kick" orchestrator
│   │   ├── match_agent.py         # Live match specialist
│   │   ├── stats_agent.py         # Player/team stats
│   │   └── tournament_agent.py    # Standings/scorers
│   ├── tools/
│   │   ├── match_tools.py         # Match FunctionTools
│   │   ├── stats_tools.py         # Stats FunctionTools
│   │   └── tournament_tools.py    # Tournament FunctionTools
│   └── services/
│       └── football_api.py        # Async football-data.org wrapper
│
├── fifa-app/                      # React Native / Expo App
│   ├── App.js                     # Root component
│   ├── .env.example               # Environment template
│   ├── src/
│   │   ├── api/
│   │   │   └── footballApi.js     # Direct API wrapper
│   │   ├── components/
│   │   │   ├── GeminiChatbot.js   # "Kick" floating chatbot
│   │   │   ├── HorizontalTabBar.js
│   │   │   ├── MatchCard.js       # Match list card
│   │   │   ├── MatchDetailSheet.js # Match detail modal
│   │   │   ├── LiveScoreCapsule.js # Floating live score
│   │   │   └── FormationChart.js  # Tactical formation view
│   │   ├── hooks/
│   │   │   └── useMatchData.js    # Tab-based data hook
│   │   ├── screens/
│   │   │   ├── LiveScreen.js      # Match hub (tabs)
│   │   │   ├── ChatScreen.js
│   │   │   ├── GalleryScreen.js
│   │   │   ├── CompassScreen.js
│   │   │   └── ShieldScreen.js
│   │   ├── store/
│   │   │   ├── matchStore.js      # Match state + screen context
│   │   │   ├── geminiStore.js     # ADK backend chat store
│   │   │   ├── authStore.js       # Firebase auth
│   │   │   └── themeStore.js      # Dark/light theme
│   │   └── utils/
│   │       └── matchUtils.js      # Shared normalization
│   └── android/                   # Native Android project
│
├── .gitignore
└── README.md                      # ← You are here
```

---

## 🔑 Environment Variables

### `adk-server/.env`

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Gemini API key for agent LLM |
| `FOOTBALL_DATA_API_KEY` | football-data.org API key |

### `fifa-app/.env`

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_FOOTBALL_API_KEY` | football-data.org API key |
| `EXPO_PUBLIC_ADK_SERVER_URL` | ADK backend URL (default: `http://localhost:8000`) |
| `EXPO_PUBLIC_FIREBASE_*` | Firebase project config |
| `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` | Google OAuth client IDs |

---

## 🧪 Testing the Agent

Once both servers are running, try these in the Kick chatbot:

| Prompt | Agent Used |
|--------|-----------|
| "What's the score right now?" | Match Agent |
| "How many goals does Mbappé have?" | Stats Agent |
| "Show me Group A standings" | Tournament Agent |
| "Who are the top 5 scorers?" | Tournament Agent |
| "How is Argentina doing?" | Stats Agent |
| "Summarize this match" | Match Agent (uses screen context) |

---

## 📄 License

This project is for educational and demonstration purposes.

- **Data**: [football-data.org](https://www.football-data.org/) — free tier (10 req/min)
- **AI**: [Google Gemini](https://ai.google.dev/) via ADK
- **FIFA Trademarks**: FIFA® and World Cup™ are trademarks of FIFA. This project is not affiliated with or endorsed by FIFA.
