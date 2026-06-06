// ─────────────────────────────────────────────────────────────────────────────
// realData.js — football-data.org v4 API layer
// API docs: https://docs.football-data.org/general/v4/match.html
// Provides: lineup, bench, coach, formation, goals, cards, subs, stats
// ─────────────────────────────────────────────────────────────────────────────
import { matchData, matchEvents, matchStats, brazilSquad, argentinaSquad } from './mockData';

const BASE_URL = 'https://api.football-data.org/v4';
const API_KEY  = process.env.EXPO_PUBLIC_FOOTBALL_API_KEY;

// FIFA World Cup 2026 competition ID on football-data.org
const WC_ID = 2000;

// ─── Lookup tables ─────────────────────────────────────────────────────────────
const FLAG_MAP = {
  'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'France': '🇫🇷', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Germany': '🇩🇪', 'Spain': '🇪🇸', 'Portugal': '🇵🇹', 'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪', 'Croatia': '🇭🇷', 'Morocco': '🇲🇦', 'Japan': '🇯🇵',
  'South Korea': '🇰🇷', 'Australia': '🇦🇺', 'Senegal': '🇸🇳', 'Mexico': '🇲🇽',
  'USA': '🇺🇸', 'United States': '🇺🇸', 'Canada': '🇨🇦', 'Ecuador': '🇪🇨',
  'Colombia': '🇨🇴', 'Uruguay': '🇺🇾', 'Chile': '🇨🇱', 'Peru': '🇵🇪',
  'Poland': '🇵🇱', 'Switzerland': '🇨🇭', 'Serbia': '🇷🇸', 'Denmark': '🇩🇰',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Saudi Arabia': '🇸🇦', 'Iran': '🇮🇷',
  'Cameroon': '🇨🇲', 'Ghana': '🇬🇭', 'Tunisia': '🇹🇳', 'Qatar': '🇶🇦',
  'Italy': '🇮🇹', 'Turkey': '🇹🇷', 'Ukraine': '🇺🇦', 'Austria': '🇦🇹',
  'Costa Rica': '🇨🇷', 'Panama': '🇵🇦', 'Honduras': '🇭🇳', 'Jamaica': '🇯🇲',
  'Nigeria': '🇳🇬', 'Mali': '🇲🇱', 'Egypt': '🇪🇬', 'Algeria': '🇩🇿',
  'South Africa': '🇿🇦', 'Venezuela': '🇻🇪', 'Paraguay': '🇵🇾', 'Bolivia': '🇧🇴',
  'New Zealand': '🇳🇿', 'Uzbekistan': '🇺🇿', 'Indonesia': '🇮🇩', 'Slovakia': '🇸🇰',
  'Hungary': '🇭🇺', 'Romania': '🇷🇴', 'Czech Republic': '🇨🇿', 'Czechia': '🇨🇿',
};

const COLOR_MAP = {
  'Brazil': '#1A7A3C', 'Argentina': '#5B9BD5', 'France': '#003189',
  'England': '#CF081F', 'Germany': '#374049', 'Spain': '#AA151B',
  'Portugal': '#006600', 'Netherlands': '#E87722', 'Belgium': '#E30613',
  'Croatia': '#D52B1E', 'Morocco': '#C1272D', 'Japan': '#003087',
  'South Korea': '#003478', 'USA': '#B22234', 'United States': '#B22234',
  'Mexico': '#006847', 'Canada': '#FF0000', 'Australia': '#00843D',
  'Senegal': '#00853F', 'Colombia': '#FCD116', 'Uruguay': '#5EB6E4',
  'Chile': '#D52B1E', 'Italy': '#003189', 'Saudi Arabia': '#006C35',
};

const POS_MAP = {
  'Goalkeeper': 'GK', 'Centre-Back': 'CB', 'Left-Back': 'LB', 'Right-Back': 'RB',
  'Defensive Midfield': 'CDM', 'Central Midfield': 'CM', 'Attacking Midfield': 'CAM',
  'Left Winger': 'LW', 'Right Winger': 'RW', 'Left Midfield': 'LM', 'Right Midfield': 'RM',
  'Centre-Forward': 'ST', 'Second Striker': 'SS', 'Attack': 'FW', 'Midfield': 'MF',
  'Defence': 'DEF',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getFlag(name) { return FLAG_MAP[name] || '🏳️'; }
function getColor(name) { return COLOR_MAP[name] || '#888888'; }
function mapPos(pos) { return POS_MAP[pos] || pos || '?'; }

function normalizeStatus(apiStatus) {
  switch (apiStatus) {
    case 'IN_PLAY':          return 'LIVE';
    case 'PAUSED':           return 'HT';
    case 'HALFTIME':         return 'HT';
    case 'EXTRA_TIME':       return 'ET';
    case 'PENALTY_SHOOTOUT': return 'PEN';
    case 'BREAK':            return 'BREAK';
    case 'FINISHED':         return 'FT';
    case 'AWARDED':          return 'FT';
    case 'SCHEDULED':
    case 'TIMED':            return 'UPCOMING';
    case 'POSTPONED':
    case 'CANCELLED':
    case 'SUSPENDED':        return 'POSTPONED';
    default:                 return 'IDLE';
  }
}

function mapPlayer(p, isBench = false) {
  return {
    id: p.id,
    num: p.shirtNumber || 0,
    name: p.name?.split(' ').slice(-1)[0] || p.name || '?',
    fullName: p.name || '?',
    pos: mapPos(p.position),
    isBench,
    rating: 80,   // not in API — default
    nat: '🏳️',    // player nationality not in lineup data
    matches: 0, goals: 0, assists: 0,
  };
}

function mapMatch(m) {
  const status = normalizeStatus(m.status);
  const homeScore = status === 'UPCOMING' ? null : (m.score?.fullTime?.home ?? m.score?.regularTime?.home ?? 0);
  const awayScore = status === 'UPCOMING' ? null : (m.score?.fullTime?.away ?? m.score?.regularTime?.away ?? 0);
  const htScore   = m.score?.halfTime
    ? `${m.score.halfTime.home ?? '-'} — ${m.score.halfTime.away ?? '-'}` : null;

  // Extra time & penalty scores
  const etScore = m.score?.extraTime
    ? `${m.score.extraTime.home ?? '-'} — ${m.score.extraTime.away ?? '-'}` : null;
  const penScore = m.score?.penalties
    ? `${m.score.penalties.home ?? '-'} — ${m.score.penalties.away ?? '-'}` : null;

  const minute = m.minute ?? (status === 'FT' ? 90 : 0);
  const injuryTime = m.injuryTime ?? 0;

  let half = '';
  if (status === 'HT')    half = 'Half Time';
  else if (status === 'ET')  half = minute > 105 ? 'ET 2nd Half' : 'ET 1st Half';
  else if (status === 'PEN') half = 'Penalties';
  else if (status === 'BREAK') half = 'Break';
  else if (status === 'LIVE') {
    if (minute > 45) half = '2nd Half';
    else half = '1st Half';
  }

  return {
    id: m.id,
    competition: m.competition?.name || 'FIFA World Cup 2026',
    competitionCode: m.competition?.code,
    venue: m.venue || 'TBD',
    date: m.utcDate,
    minute,
    injuryTime,
    status,
    half,
    htScore,
    etScore,
    penScore,
    group: m.group,
    stage: m.stage?.replace(/_/g, ' '),
    home: {
      id: m.homeTeam?.id,
      code: m.homeTeam?.tla || '',
      name: m.homeTeam?.shortName || m.homeTeam?.name || 'Home',
      fullName: m.homeTeam?.name || 'Home',
      flag: getFlag(m.homeTeam?.name),
      crest: m.homeTeam?.crest,
      color: getColor(m.homeTeam?.name),
      score: homeScore,
      formation: m.homeTeam?.formation || '4-3-3',
      coach: m.homeTeam?.coach?.name || null,
      lineup: (m.homeTeam?.lineup || []).map(p => mapPlayer(p, false)),
      bench:  (m.homeTeam?.bench  || []).map(p => mapPlayer(p, true)),
      stats:  m.homeTeam?.statistics || null,
    },
    away: {
      id: m.awayTeam?.id,
      code: m.awayTeam?.tla || '',
      name: m.awayTeam?.shortName || m.awayTeam?.name || 'Away',
      fullName: m.awayTeam?.name || 'Away',
      flag: getFlag(m.awayTeam?.name),
      crest: m.awayTeam?.crest,
      color: getColor(m.awayTeam?.name),
      score: awayScore,
      formation: m.awayTeam?.formation || '4-2-3-1',
      coach: m.awayTeam?.coach?.name || null,
      lineup: (m.awayTeam?.lineup || []).map(p => mapPlayer(p, false)),
      bench:  (m.awayTeam?.bench  || []).map(p => mapPlayer(p, true)),
      stats:  m.awayTeam?.statistics || null,
    },
  };
}

function mapEvents(m) {
  const homeId = m.homeTeam?.id;
  const events = [];

  // Goals
  (m.goals || []).forEach(g => {
    const goalType = g.type === 'OWN'     ? '(OG)' :
                     g.type === 'PENALTY' ? '(Pen)' : '';
    events.push({
      minute: g.minute + (g.injuryTime ? `+${g.injuryTime}` : ''),
      minuteNum: g.minute,
      type: 'goal',
      team: g.team?.id === homeId ? 'home' : 'away',
      player: g.scorer?.name,
      assist: g.assist?.name || null,
      desc: [
        goalType,
        g.assist ? `Assist: ${g.assist.name}` : null,
        g.score ? `Score: ${g.score.home}–${g.score.away}` : null,
      ].filter(Boolean).join(' · ') || 'Goal',
    });
  });

  // Cards
  (m.bookings || []).forEach(b => {
    const type = b.card === 'RED' || b.card === 'RED_CARD' ? 'red' :
                 b.card === 'YELLOW_RED' || b.card === 'YELLOW_RED_CARD' ? 'red2' : 'yellow';
    events.push({
      minute: b.minute,
      minuteNum: b.minute,
      type,
      team: b.team?.id === homeId ? 'home' : 'away',
      player: b.player?.name,
      desc: type === 'red2' ? 'Second yellow — sent off'
          : type === 'red'  ? 'Direct red card'
          : 'Yellow card',
    });
  });

  // Substitutions
  (m.substitutions || []).forEach(s => {
    events.push({
      minute: s.minute,
      minuteNum: s.minute,
      type: 'sub',
      team: s.team?.id === homeId ? 'home' : 'away',
      player: s.playerIn?.name,
      playerOut: s.playerOut?.name,
      playerIn: s.playerIn?.name,
      desc: `${s.playerOut?.name} ↗ ${s.playerIn?.name}`,
    });
  });

  // Sort by minute
  events.sort((a, b) => (a.minuteNum || 0) - (b.minuteNum || 0));

  // Insert half-time divider
  if (m.score?.halfTime && m.status !== 'SCHEDULED' && m.status !== 'TIMED') {
    const ht = m.score.halfTime;
    events.splice(
      events.findIndex(e => (e.minuteNum || 0) > 45),
      0,
      { minute: 45, minuteNum: 45, type: 'halftime', player: '', desc: `Half Time — ${ht.home ?? '-'} : ${ht.away ?? '-'}` }
    );
    if (events[events.findIndex(e => e.type === 'halftime')] === undefined) {
      events.push({ minute: 45, minuteNum: 45, type: 'halftime', player: '', desc: `Half Time — ${ht.home ?? '-'} : ${ht.away ?? '-'}` });
    }
  }

  // Extra time divider
  if (m.score?.extraTime) {
    const et = m.score.extraTime;
    const etIdx = events.findIndex(e => (e.minuteNum || 0) > 90);
    if (etIdx >= 0) {
      events.splice(etIdx, 0, { minute: 90, minuteNum: 90, type: 'halftime', player: '', desc: `Extra Time — ${et.home ?? '-'} : ${et.away ?? '-'}` });
    } else {
      events.push({ minute: 90, minuteNum: 90, type: 'halftime', player: '', desc: `Extra Time — ${et.home ?? '-'} : ${et.away ?? '-'}` });
    }
  }

  // Penalty shootout divider
  if (m.score?.penalties) {
    const pen = m.score.penalties;
    events.push({ minute: 120, minuteNum: 120, type: 'halftime', player: '', desc: `Penalties — ${pen.home ?? '-'} : ${pen.away ?? '-'}` });
  }

  // Full time marker
  if (m.status === 'FINISHED') {
    const ft = m.score?.fullTime;
    events.push({ minute: 90, minuteNum: 90, type: 'fulltime', player: '', desc: `Full Time — ${ft?.home ?? 0} : ${ft?.away ?? 0}` });
  }

  return events;
}

function mapStats(m) {
  const hs = m.homeTeam?.statistics;
  const as = m.awayTeam?.statistics;
  // Return empty array if no stats available — no mock fallback
  if (!hs && !as) return [];

  return [
    { label: 'Possession',       home: hs?.ball_possession   ?? 50, away: as?.ball_possession   ?? 50, unit: '%' },
    { label: 'Total Shots',      home: hs?.shots             ?? 0,  away: as?.shots             ?? 0 },
    { label: 'Shots on Target',  home: hs?.shots_on_goal     ?? 0,  away: as?.shots_on_goal     ?? 0 },
    { label: 'Saves',            home: hs?.saves             ?? 0,  away: as?.saves             ?? 0 },
    { label: 'Fouls',            home: hs?.fouls             ?? 0,  away: as?.fouls             ?? 0 },
    { label: 'Corners',          home: hs?.corner_kicks      ?? 0,  away: as?.corner_kicks      ?? 0 },
    { label: 'Offsides',         home: hs?.offsides          ?? 0,  away: as?.offsides          ?? 0 },
    { label: 'Free Kicks',       home: hs?.free_kicks        ?? 0,  away: as?.free_kicks        ?? 0 },
    { label: 'Yellow Cards',     home: hs?.yellow_cards      ?? 0,  away: as?.yellow_cards      ?? 0 },
    { label: 'Red Cards',        home: hs?.red_cards         ?? 0,  away: as?.red_cards         ?? 0 },
  ];
}

// ─── API Fetch ────────────────────────────────────────────────────────────────
async function apiFetch(path) {
  if (!API_KEY) throw new Error('EXPO_PUBLIC_FOOTBALL_API_KEY not set in .env');
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (res.status === 429) throw new Error('Rate limit reached (10 req/min). Try again shortly.');
  if (res.status === 403) throw new Error('API key invalid or access denied.');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Fetch all matches for FIFA World Cup 2026 (or another competition).
 * Returns { live, upcoming, finished } arrays of normalized matches.
 */
export async function fetchCompetitionMatches(competitionId = WC_ID) {
  const data = await apiFetch(`/competitions/${competitionId}/matches`);
  const matches = data.matches || [];

  const LIVE_STATUSES = ['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT', 'BREAK', 'HALFTIME'];

  return {
    live:     matches.filter(m => LIVE_STATUSES.includes(m.status)).map(mapMatch),
    upcoming: matches.filter(m => ['SCHEDULED', 'TIMED'].includes(m.status)).map(mapMatch),
    finished: matches.filter(m => ['FINISHED', 'AWARDED'].includes(m.status)).map(mapMatch),
  };
}

/**
 * Fetch full match details including lineup, events, and stats.
 */
export async function fetchMatchById(matchId) {
  const m = await apiFetch(`/matches/${matchId}`);
  return {
    match:  mapMatch(m),
    events: mapEvents(m),
    stats:  mapStats(m),
  };
}

/**
 * Fetch all currently IN_PLAY matches (cross-competition).
 */
export async function fetchAllLiveMatches() {
  const data = await apiFetch('/matches?status=IN_PLAY');
  return (data.matches || []).map(mapMatch);
}

// ─── Mock fallback ────────────────────────────────────────────────────────────
export const MOCK_DATA = {
  match:     matchData,
  events:    matchEvents,
  stats:     matchStats,
  homeSquad: brazilSquad,
  awaySquad: argentinaSquad,
};