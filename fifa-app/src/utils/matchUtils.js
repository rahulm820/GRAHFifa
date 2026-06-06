// ─────────────────────────────────────────────────────────────────────────────
// matchUtils.js — Shared match normalization utilities
// Extracted from realData.js for reuse across hooks and components
// ─────────────────────────────────────────────────────────────────────────────

// ─── Lookup Tables ────────────────────────────────────────────────────────────
export const FLAG_MAP = {
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

export const COLOR_MAP = {
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
export function getFlag(name) { return FLAG_MAP[name] || '🏳️'; }
export function getColor(name) { return COLOR_MAP[name] || '#888888'; }
export function mapPos(pos) { return POS_MAP[pos] || pos || '?'; }

export const ACTIVE_STATUSES = ['LIVE', 'HT', 'ET', 'PEN', 'BREAK'];

export function normalizeStatus(apiStatus) {
  switch (apiStatus) {
    case 'IN_PLAY':          return 'LIVE';
    case 'PAUSED':
    case 'HALFTIME':         return 'HT';
    case 'EXTRA_TIME':       return 'ET';
    case 'PENALTY_SHOOTOUT': return 'PEN';
    case 'BREAK':            return 'BREAK';
    case 'FINISHED':
    case 'AWARDED':          return 'FT';
    case 'SCHEDULED':
    case 'TIMED':            return 'UPCOMING';
    case 'POSTPONED':
    case 'CANCELLED':
    case 'SUSPENDED':        return 'POSTPONED';
    default:                 return 'IDLE';
  }
}

export function mapPlayer(p, isBench = false) {
  return {
    id: p.id,
    num: p.shirtNumber || 0,
    name: p.name?.split(' ').slice(-1)[0] || p.name || '?',
    fullName: p.name || '?',
    pos: mapPos(p.position),
    isBench,
    rating: 80,
    nat: '🏳️',
    matches: 0, goals: 0, assists: 0,
  };
}

export function mapMatch(m) {
  const status = normalizeStatus(m.status);
  const homeScore = status === 'UPCOMING' ? null : (m.score?.fullTime?.home ?? m.score?.regularTime?.home ?? 0);
  const awayScore = status === 'UPCOMING' ? null : (m.score?.fullTime?.away ?? m.score?.regularTime?.away ?? 0);
  const htScore   = m.score?.halfTime
    ? `${m.score.halfTime.home ?? '-'} — ${m.score.halfTime.away ?? '-'}` : null;
  const etScore = m.score?.extraTime
    ? `${m.score.extraTime.home ?? '-'} — ${m.score.extraTime.away ?? '-'}` : null;
  const penScore = m.score?.penalties
    ? `${m.score.penalties.home ?? '-'} — ${m.score.penalties.away ?? '-'}` : null;

  const minute = m.minute ?? (status === 'FT' ? 90 : 0);
  const injuryTime = m.injuryTime ?? 0;

  let half = '';
  if (status === 'HT')      half = 'Half Time';
  else if (status === 'ET')  half = minute > 105 ? 'ET 2nd Half' : 'ET 1st Half';
  else if (status === 'PEN') half = 'Penalties';
  else if (status === 'BREAK') half = 'Break';
  else if (status === 'LIVE') half = minute > 45 ? '2nd Half' : '1st Half';

  return {
    id: m.id,
    competition: m.competition?.name || 'FIFA World Cup 2026',
    competitionCode: m.competition?.code,
    venue: m.venue || 'TBD',
    date: m.utcDate,
    minute, injuryTime, status, half,
    htScore, etScore, penScore,
    group: m.group,
    stage: m.stage?.replace(/_/g, ' '),
    referees: (m.referees || []).map(r => r.name).filter(Boolean),
    home: {
      id: m.homeTeam?.id, code: m.homeTeam?.tla || '',
      name: m.homeTeam?.shortName || m.homeTeam?.name || 'Home',
      fullName: m.homeTeam?.name || 'Home',
      flag: getFlag(m.homeTeam?.name), crest: m.homeTeam?.crest,
      color: getColor(m.homeTeam?.name), score: homeScore,
      formation: m.homeTeam?.formation || '4-3-3',
      coach: m.homeTeam?.coach?.name || null,
      lineup: (m.homeTeam?.lineup || []).map(p => mapPlayer(p, false)),
      bench:  (m.homeTeam?.bench  || []).map(p => mapPlayer(p, true)),
    },
    away: {
      id: m.awayTeam?.id, code: m.awayTeam?.tla || '',
      name: m.awayTeam?.shortName || m.awayTeam?.name || 'Away',
      fullName: m.awayTeam?.name || 'Away',
      flag: getFlag(m.awayTeam?.name), crest: m.awayTeam?.crest,
      color: getColor(m.awayTeam?.name), score: awayScore,
      formation: m.awayTeam?.formation || '4-2-3-1',
      coach: m.awayTeam?.coach?.name || null,
      lineup: (m.awayTeam?.lineup || []).map(p => mapPlayer(p, false)),
      bench:  (m.awayTeam?.bench  || []).map(p => mapPlayer(p, true)),
    },
  };
}

export function mapEvents(m) {
  const homeId = m.homeTeam?.id;
  const events = [];

  (m.goals || []).forEach(g => {
    events.push({
      minute: g.minute + (g.injuryTime ? `+${g.injuryTime}` : ''),
      minuteNum: g.minute, type: 'goal',
      team: g.team?.id === homeId ? 'home' : 'away',
      player: g.scorer?.name, assist: g.assist?.name || null,
      desc: [g.type === 'OWN' ? '(OG)' : g.type === 'PENALTY' ? '(Pen)' : '',
        g.assist ? `Assist: ${g.assist.name}` : null,
        g.score ? `${g.score.home}–${g.score.away}` : null,
      ].filter(Boolean).join(' · ') || 'Goal',
    });
  });

  (m.bookings || []).forEach(b => {
    const type = b.card === 'RED' || b.card === 'RED_CARD' ? 'red' :
                 b.card === 'YELLOW_RED' || b.card === 'YELLOW_RED_CARD' ? 'red2' : 'yellow';
    events.push({ minute: b.minute, minuteNum: b.minute, type,
      team: b.team?.id === homeId ? 'home' : 'away', player: b.player?.name,
      desc: type === 'red2' ? 'Second yellow' : type === 'red' ? 'Red card' : 'Yellow card',
    });
  });

  (m.substitutions || []).forEach(s => {
    events.push({ minute: s.minute, minuteNum: s.minute, type: 'sub',
      team: s.team?.id === homeId ? 'home' : 'away',
      player: s.playerIn?.name, playerOut: s.playerOut?.name, playerIn: s.playerIn?.name,
      desc: `${s.playerOut?.name} ↗ ${s.playerIn?.name}`,
    });
  });

  events.sort((a, b) => (a.minuteNum || 0) - (b.minuteNum || 0));

  if (m.score?.halfTime && m.status !== 'SCHEDULED' && m.status !== 'TIMED') {
    const ht = m.score.halfTime;
    const idx = events.findIndex(e => (e.minuteNum || 0) > 45);
    const htEvt = { minute: 45, minuteNum: 45, type: 'halftime', player: '', desc: `Half Time — ${ht.home ?? '-'} : ${ht.away ?? '-'}` };
    if (idx >= 0) events.splice(idx, 0, htEvt);
    else events.push(htEvt);
  }

  if (m.status === 'FINISHED') {
    const ft = m.score?.fullTime;
    events.push({ minute: 90, minuteNum: 90, type: 'fulltime', player: '', desc: `Full Time — ${ft?.home ?? 0} : ${ft?.away ?? 0}` });
  }

  return events;
}

export function mapStats(m) {
  const hs = m.homeTeam?.statistics;
  const as = m.awayTeam?.statistics;
  if (!hs && !as) return [];
  return [
    { label: 'Possession', home: hs?.ball_possession ?? 50, away: as?.ball_possession ?? 50, unit: '%' },
    { label: 'Total Shots', home: hs?.shots ?? 0, away: as?.shots ?? 0 },
    { label: 'Shots on Target', home: hs?.shots_on_goal ?? 0, away: as?.shots_on_goal ?? 0 },
    { label: 'Saves', home: hs?.saves ?? 0, away: as?.saves ?? 0 },
    { label: 'Fouls', home: hs?.fouls ?? 0, away: as?.fouls ?? 0 },
    { label: 'Corners', home: hs?.corner_kicks ?? 0, away: as?.corner_kicks ?? 0 },
    { label: 'Offsides', home: hs?.offsides ?? 0, away: as?.offsides ?? 0 },
    { label: 'Yellow Cards', home: hs?.yellow_cards ?? 0, away: as?.yellow_cards ?? 0 },
    { label: 'Red Cards', home: hs?.red_cards ?? 0, away: as?.red_cards ?? 0 },
  ];
}
