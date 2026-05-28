# ⚽ FIFA Rapid Agent 2026
### Project Context Capsule — Hackathon Edition · Rapid Agent Challenge 2025
> React Native · Google Cloud · Gemini 2.0 · Elasticsearch · MongoDB · Arize · GitLab

---

## 1. Project Overview

FIFA Rapid Agent is a mobile-first companion app for the FIFA World Cup 2026, built to help fans inside and outside stadiums communicate, stay safe, discover local services, and experience the game with AI-powered intelligence. The platform is designed for millions of concurrent users across time zones, languages, and device types.

| Field | Detail |
|---|---|
| **App name** | FIFA Rapid Agent 2026 |
| **Platform** | iOS + Android via React Native 0.73+ |
| **Primary AI** | Gemini 2.0 via Google Cloud Agent Builder |
| **Hackathon track** | Elastic (primary partner) + Arize (secondary) |
| **Target users** | Stadium attendees, worldwide fans, local vendors, stadium security |
| **Scale target** | 1M+ concurrent users during peak match windows |
| **Repository** | GitLab monorepo — `mobile/` `backend/` `agents/` `infra/` |

---

## 2. The Five Modules

### M1 — Global Chat + AI Summaries

**What it does**
Worldwide real-time match discussion rooms keyed by `match_id`. WebSocket-based messaging with multi-language support. AI-generated discussion summaries refreshed every 5 minutes.

**Tech stack**
FastAPI WebSocket service · MongoDB (message store) · Elasticsearch (message indexing + full-text search) · Gemini 2.0 (summarisation) · Redis (pub/sub) · React Native FlatList

**Elasticsearch role**
All messages indexed with fields: `user_id`, `match_id`, `text`, `timestamp`, `sentiment`. Summary job queries last 200 messages per room and feeds to Gemini. ES also powers search-within-chat and trending topic detection via terms aggregation.

---

### M2 — Community Gallery + Archive

**What it does**
Stadium attendees upload photos/videos. Google Vision AI runs safety moderation and auto-tagging (moment type, camera angle, players visible, quality score). Archive-worthy shots are permanently stored.

**Tech stack**
FastAPI upload service · Google Cloud Storage (files) · Google Vision AI (moderation + tagging) · Elasticsearch (media metadata index) · MongoDB (document store) · Gemini 2.0 (contextual tags)

**Elasticsearch role**
Each media doc indexed with: `match_id`, `moment_type`, `stadium_section`, `ai_tags`, `players_detected`, `quality_score`, `archive_worthy`. Powers multi-faceted gallery search by player, moment type, section, date range, and quality threshold.

---

### M3 — AI Compass · Local Guide + Task Agent

**What it does**
Gemini-powered conversational agent helping tourists find hospitals, hotels, restaurants, and transport. Handles multi-step tasks: intent classification → geo search → availability check → booking confirmation.

**Tech stack**
Google Cloud Agent Builder · Gemini 2.0 (agent backbone) · Elasticsearch (geo_point index for local listings) · MongoDB (venue + booking docs) · Google Maps API · Arize Phoenix (traces every agent turn)

**Elasticsearch role**
`geo_search_tool` queries ES `geo_distance` filter within configurable radius. Local listings index: `name`, `category`, `location (geo_point)`, `languages_spoken`, `rating`, `world_cup_special` flag. Dense vector field enables semantic kNN search.

---

### M4 — Complaints + Safety System

**What it does**
Fans report incidents with type, description, location, and optional photo. AI classifies priority (CRITICAL / HIGH / MEDIUM / LOW). Anonymized complaint pins visible to nearby users. Stadium management heatmap view.

**Tech stack**
FastAPI complaint service · Google Vision AI (evidence photo — clothing description only, no biometrics) · Gemini 2.0 (priority classification) · Elasticsearch (geo-indexed complaints) · MongoDB (complaint docs)

**Elasticsearch role**
Complaints geo-indexed so stadium ops can query: all HIGH priority in Section D, last 2 hours. Aggregations surface hotspot sections. React Native safety map shows anonymized complaint density per stadium section.

---

### M5 — Live Match Hub

**What it does**
Full match intelligence: team lineups with dynamic formation chart (SVG-based, any formation string), player cards, manager profiles, substitutes bench, live score capsule, match stats comparison bars, and event timeline.

**Tech stack**
FastAPI match service · Cloud Pub/Sub (live FIFA API events) · MongoDB (match + player docs) · Elasticsearch (historical stats) · React Native SVG (formation pitch) · Gemini 2.0 (match analyst agent)

**Elasticsearch role**
Historical player and match stats indexed in ES. Match analyst agent uses ES to answer contextual questions: head-to-head records, manager tactical history, player form across tournaments.

---

## 3. Technical Architecture

### 3.1 System Layers

```
┌────────────────────────────────────────────────────────────────┐
│              React Native (iOS + Android)                      │
│   Chat · Gallery · AI Compass · Complaints · Match Hub        │
├────────────────────────────────────────────────────────────────┤
│           API Gateway — Google Cloud Apigee                    │
│         Firebase JWT auth · rate limiting · routing           │
├──────────────┬─────────────┬──────────────┬────────────────────┤
│ Chat Service │Gallery Svc  │ Chatbot Svc  │Complaint · Match   │
│  FastAPI WS  │FastAPI REST │ Agent Builder│  FastAPI REST      │
├──────────────┴─────────────┴──────────────┴────────────────────┤
│              Agent Layer — Google Cloud Agent Builder          │
│     Orchestrator · Local Guide · Task Agent · Match Analyst   │
│                      Gemini 2.0                               │
├───────────────────────┬────────────────────────────────────────┤
│   Elasticsearch 8.x   │   MongoDB Atlas                        │
│  6 indices · geo ·    │  Users · Players · Matches ·          │
│  vector · full-text   │  Complaints · Media · Bookings        │
├───────────────────────┴────────────────────────────────────────┤
│   Arize Phoenix · Google Cloud Storage · Vision AI            │
│   Redis · Cloud Pub/Sub · Google Maps · Firebase Auth         │
│              Google Cloud Run (auto-scale 3–100)              │
└────────────────────────────────────────────────────────────────┘
```

| Layer | Technology |
|---|---|
| **Frontend** | React Native 0.73+ · React Navigation 6 · Zustand · react-native-svg · react-native-reanimated 3 · @gorhom/bottom-sheet |
| **API Gateway** | Google Cloud Apigee — Firebase JWT auth, rate limiting, routing |
| **Microservices** | Python FastAPI — 5 services on Google Cloud Run, auto-scale 3–100 instances |
| **Agent layer** | Google Cloud Agent Builder + Gemini 2.0 · Orchestrator routes to sub-agents |
| **Primary search** | Elasticsearch 8.x — 6 indices |
| **Primary database** | MongoDB Atlas — users, players, matches, complaints, media, bookings |
| **File storage** | Google Cloud Storage — community gallery, evidence photos |
| **Cache / pub-sub** | Redis — WebSocket pub/sub, rate limit counters, hot match data |
| **AI observability** | Arize Phoenix — traces all Gemini calls, eval scoring, hallucination monitoring |
| **Vision AI** | Google Vision AI — gallery moderation, evidence photo analysis, auto-tagging |
| **Live data** | FIFA Live API → Cloud Pub/Sub → Match service → MongoDB + WebSocket push |
| **CI/CD** | GitLab — monorepo pipelines, auto-deploy to Cloud Run on merge to main |

---

### 3.2 Elasticsearch Index Schemas

| Index | Purpose | Key fields |
|---|---|---|
| `messages` | Chat search, summary job input, trending topics | `match_id (keyword)`, `text (text/analyzed)`, `sentiment (keyword)`, `timestamp (date)` |
| `media_gallery` | Gallery multi-faceted search and archive | `match_id`, `moment_type`, `players_detected (keyword)`, `ai_tags (text)`, `quality_score (float)`, `location (geo_point)` |
| `local_listings` | Geo-search for tourist chatbot | `location (geo_point)`, `category (keyword)`, `languages_spoken`, `rating (float)`, `world_cup_special (bool)` |
| `complaints` | Heatmap, proximity alerts, pattern analysis | `stadium_id`, `priority (keyword)`, `location.geo_point`, `created_at (date)`, `status (keyword)` |
| `players` | Historical stats for match analyst agent | `name (text)`, `nationality`, `position (keyword)`, `career_stats (object)`, `world_cup_goals (int)` |
| `matches` | Historical H2H, manager records | `home_team`, `away_team (keyword)`, `stage`, `status`, `events (nested)`, `statistics (object)`, `date` |

---

### 3.3 Gemini Agent Tools

| Tool | Description |
|---|---|
| `geo_search_tool` | Queries ES `local_listings` with `geo_distance` filter. Inputs: user lat/lng, radius_km, category. Returns ranked venues with distance. |
| `booking_tool` | Multi-step: find venue in ES → check availability → confirm with user → write booking to MongoDB. Each step traced in Arize. |
| `match_context_tool` | Fetches live match from MongoDB + historical from ES. Used by match analyst for contextual Q&A. |
| `complaint_classify_tool` | Gemini prompt with complaint text + Vision AI output → returns priority level, response time, recommended action. |
| `summary_tool` | Queries last 200 messages from ES for a match room → Gemini summarisation → stores summary to MongoDB. |

---

## 4. React Native Frontend

### 4.1 Navigation Structure

Five-tab bottom navigator (React Navigation 6). Persistent `LiveScoreCapsule` overlay rendered above navigator — draggable pill, pulses on goal event.

| Tab | Route / Stack | Key components | Zustand store |
|---|---|---|---|
| **Live** | LiveStack | ScorePanel, StatsBars, FormationChart, EventTimeline | `useMatchStore` |
| **Chat** | ChatStack | AISummaryBanner, MessageFeed, ChatInput, ReactionBar | `useChatStore` |
| **Gallery** | GalleryStack | MasonryGrid, UploadFAB, FilterChips, ImageModal | `useGalleryStore` |
| **Compass** | CompassStack | QuickAccessCards, ChatInterface, SuggestedPrompts | `useUserStore` |
| **Shield** | ShieldStack | AlertBanner, ComplaintFAB, ComplaintFeed, SafetyMap | `useComplaintStore` |

---

### 4.2 Formation Chart Component

The `FormationChart` is the visual centrepiece of the Match Hub. Built with `react-native-svg`, it renders a full football pitch with alternating green stripe mowing pattern, regulation markings, and dynamically positioned player markers derived from any formation string.

```tsx
<FormationChart
  homeFormation="4-3-3"
  awayFormation="4-2-3-1"
  homePlayers={brazilLineup}
  awayPlayers={argentinaLineup}
  homeColor="#1A7A3C"
  awayColor="#C41E3A"
/>
```

**Positioning logic**
```
Parse "4-3-3"
→ Split by "-"  →  [4, 3, 3]
→ Prepend GK    →  [1, 4, 3, 3]
→ Row y-positions:  GK=10%  DEF=28%  MID=50-65%  ATT=82%
→ Within each row: distribute players evenly across pitch width
→ Away team: mirror vertically (GK at top, attack at bottom)
```

**Pitch rendering**
- SVG `LinearGradient` stripes for mowing pattern
- `Rect` for penalty areas and goal areas
- `Circle` for center spot, penalty spots
- `Path` for corner arcs and center circle
- All markings white, 1.5px, 0.7 opacity

**Player markers**
- Circle 32px diameter, jersey number inside, name below (max 10 chars)
- `homeColor` / `awayColor` fill, white 2px border
- GK variant: star outline
- Tap → `@gorhom/bottom-sheet` profile panel (name, number, nationality, 3 stats, rating badge)
- Entrance animation: stagger-pop from centre, 50ms delay per player via `react-native-reanimated`

**Supported formations**
`4-4-2` · `4-3-3` · `4-2-3-1` · `3-5-2` · `3-4-3` · `5-3-2` · `4-1-4-1` · `4-5-1` · `4-3-2-1` · `4-1-2-1-2` · `5-4-1` · any valid `n-n-n-n` string

---

### 4.3 Theme System

| Token | Light mode | Dark mode |
|---|---|---|
| Background | `#F5F5F0` (stadium concrete) | `#0A0F0A` (pitch black-green) |
| Surface | `#FFFFFF` | `#121A12` |
| Surface elevated | `#FAFAF7` | `#1A2A1A` |
| Primary green | `#1A7A3C` | `#2DB555` |
| Accent gold | `#E8C53A` | `#F5D264` |
| Text primary | `#0D0D0D` | `#F0F0EB` |
| Text secondary | `#5C5C5C` | `#A8A89E` |
| Border | `#E0E0D8` | `#2A3A2A` |

**Toggle** — `ThemeToggle` component (sun/moon icon) in every screen header. Persists to `AsyncStorage`. 300ms interpolated transition across full app via `useThemeStore` (Zustand).

---

### 4.4 Zustand State Stores

| Store | State + key actions |
|---|---|
| `useMatchStore` | `currentMatch`, `liveScore`, `matchMinute`, `events[]`, `formations`, `lineups` · Actions: `updateScore`, `addEvent`, `setFormation` |
| `useChatStore` | `messages[]`, `activeRoom`, `aiSummary`, `summaryUpdatedAt` · Actions: `sendMessage`, `updateSummary`, `addReaction` |
| `useGalleryStore` | `items[]`, `activeFilter`, `uploadState`, `selectedItem` · Actions: `uploadMedia`, `setFilter`, `likeItem` |
| `useUserStore` | `profile`, `location (lat/lng)`, `preferences`, `chatHistory[]` · Actions: `updateLocation`, `sendChatMessage` |
| `useComplaintStore` | `complaints[]`, `submissionStep`, `nearbyAlerts[]` · Actions: `submitComplaint`, `upvoteComplaint`, `setStep` |
| `useThemeStore` | `isDark (bool)` · Actions: `toggle()` — persists to AsyncStorage, triggers global color interpolation |

---

### 4.5 React Native Package List

```json
{
  "react-native": "0.73+",
  "@react-navigation/native": "^6",
  "@react-navigation/bottom-tabs": "^6",
  "@react-navigation/stack": "^6",
  "react-native-svg": "^14",
  "react-native-reanimated": "^3",
  "react-native-gesture-handler": "^2",
  "@gorhom/bottom-sheet": "^4",
  "zustand": "^4",
  "react-native-linear-gradient": "^2",
  "react-native-vector-icons": "^10",
  "@react-native-async-storage/async-storage": "^1",
  "react-native-haptic-feedback": "^2"
}
```

---

## 5. Partner Integrations

### 5.1 Elasticsearch — Primary Partner (Judging Track)

- **Chat module** — every message indexed at send time. Summary job uses ES aggregation query. Trending topics via `terms` aggregation on recent messages per match room.
- **Gallery module** — media metadata indexed with `geo_point`, `moment_type`, `ai_tags`. Supports search by player name, moment, section, date range, quality threshold.
- **Compass module** — local listings indexed with `geo_point`. Chatbot `geo_search_tool` runs `geo_distance` query with optional category/text filters.
- **Complaints module** — complaints indexed with `geo_point` and `priority`. Stadium ops dashboard runs `range` + `terms` aggregations. Proximity alert queries run on each app open.
- **Match module** — historical player/match data indexed. Match analyst agent queries H2H records, manager stats, player form.
- **Vector search** — semantic search on gallery `ai_tags` and chatbot queries using ES `dense_vector` fields + kNN search.

---

### 5.2 Arize Phoenix — Secondary Partner

- Every Gemini API call wrapped in an Arize span: model input, output, latency, token count, cost.
- **Booking agent** — multi-step trace shows intent classification → geo search → availability check → confirmation as a waterfall.
- **Summary agent** — eval scoring on summary quality (relevance, coverage, length).
- **Complaint classifier** — traces classification prompt → priority output → confidence score.
- **Demo asset** — live Arize dashboard showing real-time agent traces during the hackathon demo — a key judging differentiator.

---

### 5.3 MongoDB Atlas

- Primary document store for all entities: users, players, matches, complaints, media metadata, bookings, local businesses.
- Atlas Vector Search on player descriptions and match summaries for semantic retrieval.
- Flexible schema handles varied match event types, player stat objects, and complaint evidence.

---

### 5.4 GitLab

- Monorepo structure: `/mobile` `/backend` `/agents` `/infra`. CI/CD pipeline: lint → test → build → deploy to Cloud Run on merge to `main`.
- Environment-specific configs via GitLab CI variables. Separate pipeline per service for independent deployment.

---

## 6. Build Plan

| Phase | Weeks | Tasks | Milestone |
|---|---|---|---|
| **P1** | 1–2 | Monorepo setup · GitLab CI skeleton · Firebase Auth · MongoDB + ES cluster · React Native shell with 5 tabs · LiveScoreCapsule · Zustand stores · mock data seed | App boots, tabs navigate, theme toggle works |
| **P2** | 2–3 | Chat service (FastAPI WebSocket) · message indexing to ES · AI Summary job (Gemini) · chat UI · reaction bar · Arize trace on summary calls | Live chat works, summaries appear every 5 min |
| **P3** | 3–4 | Gallery upload endpoint · Vision AI moderation + tagging · ES media index · masonry grid · image modal · filter chips | Upload → moderation → tagged gallery visible |
| **P4** | 4–5 | Agent Builder chatbot · `geo_search_tool` (ES) · `booking_tool` (MongoDB) · `match_context_tool` · Arize multi-step trace · Compass screen UI | End-to-end booking with Arize waterfall |
| **P5** | 5 | Complaint service · Vision AI evidence analysis · priority classification · ES geo-index · safety map · alert banner | Complaint submitted, priority assigned, map updates |
| **P6** | 5–6 | FIFA API → Pub/Sub → Match service · MongoDB match docs · FormationChart SVG · player bottom sheet · stats bars · event timeline | Live match screen with formation, score, timeline |
| **P7** | 6 | Integration testing · demo data polish · Arize dashboard setup · performance profiling · hackathon submission | Full demo-ready build |

---

## 7. Key API Endpoints

| Endpoint | Description |
|---|---|
| `GET /matches/:id/live` | Live match data — score, minute, events, formations, lineups |
| `GET /matches/:id/chat/messages` | Paginated chat messages for a match room |
| `POST /matches/:id/chat/messages` | Send a chat message (WebSocket preferred, REST fallback) |
| `GET /matches/:id/chat/summary` | Latest AI-generated discussion summary |
| `POST /gallery/upload` | Upload media — `multipart/form-data`, returns `media_id` + tags |
| `GET /gallery/search` | Query params: `match_id`, `moment_type`, `player`, `section`, `q` |
| `POST /chatbot/message` | Send user message to Gemini agent — returns agent response + tool results |
| `GET /local/search` | Geo-search local listings — params: `lat`, `lng`, `radius`, `category`, `q` |
| `POST /bookings` | Create booking — `venue_id`, `user_id`, `datetime`, `party_size` |
| `POST /complaints` | Submit complaint — `type`, `description`, `location`, optional photo |
| `GET /complaints/nearby` | Anonymized complaints within radius of user location |
| `GET /stadium/:id/heatmap` | Complaint density by section for safety map |

---

## 8. Core Data Models (MongoDB)

### User
```json
{
  "_id": "ObjectId",
  "firebase_uid": "string",
  "username": "string",
  "display_name": "string",
  "nationality": "string",
  "language_prefs": ["en", "pt", "es"],
  "location": { "type": "Point", "coordinates": [lng, lat] },
  "created_at": "ISODate",
  "last_active": "ISODate"
}
```

### Match
```json
{
  "match_id": "string",
  "stage": "group | R16 | QF | SF | Final",
  "status": "upcoming | live | completed",
  "home_team": { "name": "Brazil", "flag": "🇧🇷", "color": "#1A7A3C", "formation": "4-3-3" },
  "away_team": { "name": "Argentina", "flag": "🇦🇷", "color": "#74ACDF", "formation": "4-2-3-1" },
  "score": { "home": 2, "away": 1 },
  "match_minute": 67,
  "events": [{ "minute": 23, "type": "goal", "team": "home", "player": "Vinicius Jr.", "description": "Left foot finish" }],
  "home_lineup": [{ "name": "Alisson", "number": 1, "position": "GK" }],
  "home_bench": [],
  "away_lineup": [],
  "away_bench": []
}
```

### Complaint
```json
{
  "complaint_id": "string",
  "reporter_id": "hashed_user_id",
  "type": "physical_altercation | harassment | intoxication | fake_service | racism | lost_item | medical | other",
  "description": "string",
  "priority": "CRITICAL | HIGH | MEDIUM | LOW",
  "location": {
    "section": "C",
    "row": "12",
    "geo_point": { "type": "Point", "coordinates": [lng, lat] }
  },
  "status": "open | in_progress | resolved",
  "evidence_analysis": {
    "visual_description": ["red jacket", "standing"],
    "dominant_colors": ["#CC0000"],
    "privacy_note": "No biometric data stored — visual description only"
  },
  "created_at": "ISODate",
  "resolved_at": "ISODate"
}
```

---

## 9. Privacy & Compliance

| Data type | Rules |
|---|---|
| **Complaint photos** | 30-day retention · Vision AI describes clothing/colors only · no facial recognition · no biometric storage · anonymized after resolution |
| **Gallery photos** | Permanent archive · user deletion allowed · no facial recognition · commercial use requires explicit consent |
| **Location data** | 24-hour retention · neighbourhood-level precision only · no exact GPS stored · no third-party sharing |
| **Chat messages** | 90-day retention · encryption in transit and at rest · AI training use is opt-in only |
| **Right to erasure** | GDPR-compliant pipeline: complaints anonymized, gallery attribution removed, location history deleted, chat anonymized |
| **Jurisdiction** | FIFA World Cup 2026 spans USA, Canada, Mexico — complies with GDPR, CCPA, PIPEDA |

---

## 10. Hackathon Demo Script

> Recommended 5-minute flow to maximise judge impact

| Time | Action |
|---|---|
| **0:00** | Open app — live score capsule visible top-right. Navigate to Live Match Hub. Show FormationChart animating in: Brazil 4-3-3 vs Argentina 4-2-3-1. Tap Vinicius Jr. to open player profile sheet. |
| **1:00** | Switch to Chat tab. Show global discussion room. Point to AI Summary banner ("Updated 2 min ago"). Send a message. Add reaction. Open Arize Phoenix in browser — show the Gemini summary span with latency. |
| **2:00** | Switch to Gallery tab. Upload a photo from device. Show Vision AI safety check + auto-tags appearing. Search "goal Section B" — ES returns tagged results instantly. |
| **3:00** | Switch to Compass tab. Type "find a halal restaurant within 1km of the stadium." Show `geo_search_tool` firing in Arize trace waterfall. Results appear as location cards. Then type "book a table for 4 at [result] tonight at 8pm." Show full multi-step booking agent trace in Arize. |
| **4:00** | Switch to Shield tab. Raise complaint → Harassment → Section C Row 12 → submit. Show HIGH priority badge auto-assigned. Anonymized pin appears on Safety Map. Open ES DevTools — show geo aggregation returning hotspot data. |
| **4:45** | Closing — show Arize dashboard: all agent calls traced, eval scores, no hallucinations flagged. Key message: **5 features · 1 coherent app · Elasticsearch core to 4 of 5 features · Arize making Gemini production-observable.** |

---

## Quick Reference — Mock Data Seed

```
Match:    Brazil 🇧🇷 2–1 Argentina 🇦🇷  |  67'  |  Group A Matchday 2

Brazil (4-3-3):
  GK  Alisson (#1)
  DEF Danilo (#2) · Militão (#3) · Marquinhos (#4) · Magalhães (#6)
  MID Casemiro (#5) · Paquetá (#10) · Rodrygo (#11)
  ATT Raphinha (#19) · Endrick (#9) · Vinicius Jr. (#7)

Argentina (4-2-3-1):
  GK  Martínez (#23)
  DEF Montiel (#2) · Romero (#13) · Lisandro (#5) · Acuña (#8)
  MID De Paul (#7) · Mac Allister (#20)
  ATT Dybala (#21) · Enzo (#24) · Messi (#10)
  ST  Lautaro (#22)

Chat:     20 messages in PT/ES/EN with reactions
Gallery:  12 items with football tags
Complaints: 5 cards — 1 CRITICAL, 1 HIGH, 2 MEDIUM, 1 LOW
```

---

*FIFA Rapid Agent 2026 · Context Capsule v1.0 · Built for Rapid Agent Hackathon*
