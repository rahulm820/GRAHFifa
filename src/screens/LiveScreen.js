import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, FlatList, Animated,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import FormationChart from '../components/FormationChart';
import { useThemeStore } from '../store/themeStore';
import { useMatchStore } from '../store/matchStore';

const TABS = ['Overview', 'Lineup', 'Stats', 'Events'];

// Active statuses where the match is in progress
const ACTIVE_STATUSES = ['LIVE', 'HT', 'ET', 'PEN', 'BREAK'];

// ─── Countdown helper ─────────────────────────────────────────────────────────
function useCountdown(targetDate) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = new Date(targetDate) - Date.now();
      if (diff <= 0) { setLeft({ days: 0, hrs: 0, mins: 0, secs: 0 }); return; }
      setLeft({
        days: Math.floor(diff / 86400000),
        hrs:  Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  return left;
}

// ─── Live pulse dot ───────────────────────────────────────────────────────────
function PulseDot({ color }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.pulseDot, { backgroundColor: color, opacity: anim }]} />;
}

// ─── Status pill config ───────────────────────────────────────────────────────
const STATUS_PILL = {
  LIVE:  { bg: '#e84040', label: null, showDot: true },
  HT:    { bg: '#E8A030', label: 'HALF TIME', showDot: false },
  ET:    { bg: '#C77DFF', label: null, showDot: true },
  PEN:   { bg: '#7B2FF7', label: 'PENALTIES', showDot: true },
  BREAK: { bg: '#E8A030', label: 'BREAK', showDot: true },
  FT:    { bg: null, label: 'FULL TIME', showDot: false, useMuted: true },
};

// ─── Score Panel ──────────────────────────────────────────────────────────────
function ScorePanel({ match, theme }) {
  const isActive   = ACTIVE_STATUSES.includes(match.status);
  const isUpcoming = match.status === 'UPCOMING';
  const isFt       = match.status === 'FT';

  const pill = STATUS_PILL[match.status];

  // Format minute display with injury time
  const minuteDisplay = match.injuryTime && match.injuryTime > 0
    ? `${match.minute}+${match.injuryTime}'`
    : `${match.minute}'`;

  return (
    <View style={[styles.scorePanel, { backgroundColor: theme.surface, borderTopColor: match.home.color }]}>
      {/* Competition + Group */}
      <Text style={[styles.competitionLabel, { color: theme.textMuted }]}>
        {match.competition?.toUpperCase()} {match.group ? `· ${match.group}` : ''}
        {match.stage ? ` · ${match.stage}` : ''}
      </Text>

      <View style={styles.scoreRow}>
        {/* Home */}
        <View style={styles.teamCol}>
          <View style={[styles.jersey, { backgroundColor: match.home.color }]}>
            <Text style={styles.jNum}>{match.home.code}</Text>
          </View>
          <Text style={[styles.teamName, { color: theme.textPrimary }]}>{match.home.flag} {match.home.name}</Text>
          <Text style={[styles.formation, { color: theme.textMuted }]}>{match.home.formation}</Text>
        </View>

        {/* Score / Time */}
        <View style={styles.scoreCol}>
          {isUpcoming ? (
            <>
              <Text style={[styles.vsText, { color: theme.textSecondary }]}>VS</Text>
              <Text style={[styles.kickoffTime, { color: theme.primary }]}>
                {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.bigScore, { color: theme.textPrimary }]}>
                {match.home.score} — {match.away.score}
              </Text>
              {/* Status pill */}
              {pill && (
                <View style={[
                  styles.livePill,
                  { backgroundColor: pill.useMuted ? theme.textMuted : pill.bg }
                ]}>
                  {pill.showDot && <PulseDot color="#fff" />}
                  <Text style={styles.livePillTxt}>
                    {pill.label || `${minuteDisplay} ${match.half}`}
                  </Text>
                </View>
              )}
              {/* Extra time score */}
              {match.etScore && (
                <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>
                  AET {match.etScore}
                </Text>
              )}
              {/* Penalty score */}
              {match.penScore && (
                <Text style={{ color: '#7B2FF7', fontSize: 11, marginTop: 2, fontWeight: '700' }}>
                  PEN {match.penScore}
                </Text>
              )}
              {/* HT score */}
              {match.htScore && (
                <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>HT {match.htScore}</Text>
              )}
            </>
          )}
        </View>

        {/* Away */}
        <View style={styles.teamCol}>
          <View style={[styles.jersey, { backgroundColor: match.away.color }]}>
            <Text style={styles.jNum}>{match.away.code}</Text>
          </View>
          <Text style={[styles.teamName, { color: theme.textPrimary }]}>{match.away.flag} {match.away.name}</Text>
          <Text style={[styles.formation, { color: theme.textMuted }]}>{match.away.formation}</Text>
        </View>
      </View>

      {match.venue && match.venue !== 'TBD' && (
        <Text style={[styles.venueLabel, { color: theme.textMuted }]}>📍 {match.venue}</Text>
      )}
    </View>
  );
}

// ─── Event row ────────────────────────────────────────────────────────────────
const EVENT_META = {
  goal:     { icon: '⚽', label: 'GOAL',       bg: '#1A7A3C22', border: '#1A7A3C' },
  yellow:   { icon: '🟨', label: 'YELLOW',     bg: '#E8C53A22', border: '#E8C53A' },
  red:      { icon: '🟥', label: 'RED CARD',   bg: '#E8404022', border: '#E84040' },
  red2:     { icon: '🟥', label: '2ND YELLOW', bg: '#E8404022', border: '#E84040' },
  sub:      { icon: '🔄', label: 'SUB',        bg: '#4A90E222', border: '#4A90E2' },
  halftime: { icon: '⏱',  label: '',           bg: 'transparent', border: 'transparent' },
  fulltime: { icon: '🏁', label: '',           bg: 'transparent', border: 'transparent' },
};

function EventRow({ e, theme, homeColor, awayColor }) {
  if (e.type === 'halftime' || e.type === 'fulltime') {
    return (
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        <Text style={[styles.dividerText, { color: theme.textMuted }]}>
          {e.type === 'halftime' ? '⏱ ' : '🏁 '}{e.desc}
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      </View>
    );
  }

  const meta = EVENT_META[e.type] || EVENT_META.goal;
  const isHome = e.team === 'home';

  return (
    <View style={[styles.eventRow, { flexDirection: isHome ? 'row' : 'row-reverse' }]}>
      {/* Minute badge */}
      <View style={[styles.minuteBadge, { backgroundColor: meta.border + '22' }]}>
        <Text style={[styles.minuteText, { color: meta.border }]}>{e.minute}'</Text>
      </View>

      {/* Event card */}
      <View style={[
        styles.eventCard,
        { backgroundColor: meta.bg, borderLeftColor: isHome ? meta.border : 'transparent',
          borderRightColor: isHome ? 'transparent' : meta.border, borderLeftWidth: isHome ? 3 : 0, borderRightWidth: isHome ? 0 : 3 },
      ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>{meta.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eventPlayer, { color: theme.textPrimary }]}>
              {e.player}
              {e.type === 'goal' && e.assist ? (
                <Text style={{ color: theme.textSecondary, fontWeight: '400', fontSize: 12 }}> · assist: {e.assist}</Text>
              ) : null}
            </Text>
            {e.type === 'sub' ? (
              <Text style={[styles.eventDesc, { color: theme.textSecondary }]}>
                ⬆ {e.playerIn}  ⬇ {e.playerOut}
              </Text>
            ) : (
              <Text style={[styles.eventDesc, { color: theme.textSecondary }]}>{e.desc}</Text>
            )}
          </View>
          <View style={[styles.eventTeamDot, { backgroundColor: isHome ? homeColor : awayColor }]} />
        </View>
      </View>
    </View>
  );
}

// ─── Stat bar ─────────────────────────────────────────────────────────────────
function StatBar({ stat, homeColor, awayColor, theme }) {
  const total   = (stat.home + stat.away) || 1;
  const homePct = (stat.home / total) * 100;
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{stat.home}{stat.unit || ''}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{stat.label}</Text>
        <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{stat.away}{stat.unit || ''}</Text>
      </View>
      <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: theme.border }}>
        <View style={{ width: `${homePct}%`, backgroundColor: homeColor }} />
        <View style={{ flex: 1, backgroundColor: awayColor }} />
      </View>
    </View>
  );
}

// ─── Countdown tiles ──────────────────────────────────────────────────────────
function CountdownTile({ value, label, theme }) {
  return (
    <View style={[styles.countdownTile, { backgroundColor: theme.surface }]}>
      <Text style={[styles.countdownNum, { color: theme.primary }]}>{String(value).padStart(2, '0')}</Text>
      <Text style={[styles.countdownLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

// ─── Match picker card ────────────────────────────────────────────────────────
function MatchPickerCard({ match, theme, onPress }) {
  const pill = STATUS_PILL[match.status] || STATUS_PILL.LIVE;
  const minuteDisplay = match.injuryTime && match.injuryTime > 0
    ? `${match.minute}+${match.injuryTime}'`
    : `${match.minute}'`;

  return (
    <TouchableOpacity style={[styles.pickerCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={onPress} activeOpacity={0.8}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[styles.pickerTeam, { color: theme.textPrimary }]}>{match.home.flag} {match.home.name}</Text>
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.livePill, { backgroundColor: pill.bg || '#e84040', marginBottom: 4 }]}>
            {pill.showDot && <PulseDot color="#fff" />}
            <Text style={styles.livePillTxt}>
              {pill.label || minuteDisplay}
            </Text>
          </View>
          <Text style={[styles.pickerScore, { color: theme.textPrimary }]}>{match.home.score} — {match.away.score}</Text>
        </View>
        <Text style={[styles.pickerTeam, { color: theme.textPrimary }]}>{match.away.flag} {match.away.name}</Text>
      </View>
      <Text style={[styles.pickerCompetition, { color: theme.textMuted }]}>
        {match.competition} {match.group ? `· ${match.group}` : ''} {match.stage ? `· ${match.stage}` : ''}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Upcoming match card ──────────────────────────────────────────────────────
function UpcomingCard({ match, theme, onPress }) {
  const kickoff = new Date(match.date);
  return (
    <TouchableOpacity
      style={[styles.upcomingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.pickerTeam, { color: theme.textPrimary }]}>{match.home.flag} {match.home.name}</Text>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.upcomingTime, { color: theme.primary }]}>
            {kickoff.toLocaleDateString([], { day: 'numeric', month: 'short' })}
          </Text>
          <Text style={[{ color: theme.textSecondary, fontSize: 12 }]}>
            {kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={[styles.pickerTeam, { color: theme.textPrimary }]}>{match.away.flag} {match.away.name}</Text>
      </View>
      {match.group && <Text style={[styles.pickerCompetition, { color: theme.textMuted }]}>{match.group}</Text>}
    </TouchableOpacity>
  );
}

// ─── Finished match result card ───────────────────────────────────────────────
function ResultCard({ match, theme, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.resultTeamRow}>
        <Text style={[styles.resultTeam, { color: theme.textPrimary }]}>{match.home.flag}</Text>
        <Text style={[styles.resultTeamCode, { color: theme.textPrimary }]}>{match.home.code}</Text>
      </View>
      <View style={styles.resultCenter}>
        <Text style={[styles.resultScore, { color: theme.textPrimary }]}>
          {match.home.score} — {match.away.score}
        </Text>
        <View style={[styles.ftBadge, { backgroundColor: theme.textMuted + '22' }]}>
          <Text style={[styles.ftBadgeText, { color: theme.textMuted }]}>FT</Text>
        </View>
        {match.etScore && (
          <Text style={{ color: theme.textMuted, fontSize: 9, marginTop: 2 }}>AET</Text>
        )}
        {match.penScore && (
          <Text style={{ color: '#7B2FF7', fontSize: 9, marginTop: 1, fontWeight: '700' }}>PEN {match.penScore}</Text>
        )}
      </View>
      <View style={styles.resultTeamRow}>
        <Text style={[styles.resultTeam, { color: theme.textPrimary }]}>{match.away.flag}</Text>
        <Text style={[styles.resultTeamCode, { color: theme.textPrimary }]}>{match.away.code}</Text>
      </View>
      <Text style={[styles.resultDate, { color: theme.textMuted }]}>
        {new Date(match.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Bench row ────────────────────────────────────────────────────────────────
function BenchSection({ squad, color, coach, theme }) {
  if (!squad?.length) return null;
  return (
    <View style={[styles.benchBox, { borderColor: theme.border }]}>
      <Text style={[styles.benchTitle, { color: theme.textMuted }]}>BENCH</Text>
      {squad.map((p, i) => (
        <View key={i} style={styles.benchRow}>
          <View style={[styles.benchNum, { backgroundColor: color + '33' }]}>
            <Text style={{ color, fontWeight: '700', fontSize: 11 }}>{p.num}</Text>
          </View>
          <Text style={[styles.benchName, { color: theme.textPrimary }]}>{p.fullName || p.name}</Text>
          <Text style={[styles.benchPos, { color: theme.textMuted }]}>{p.pos}</Text>
        </View>
      ))}
      {coach && (
        <View style={[styles.benchRow, { marginTop: 4, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 8 }]}>
          <View style={[styles.benchNum, { backgroundColor: '#88888822' }]}>
            <Text style={{ color: theme.textMuted, fontWeight: '700', fontSize: 10 }}>HC</Text>
          </View>
          <Text style={[styles.benchName, { color: theme.textSecondary }]}>{coach}</Text>
          <Text style={[styles.benchPos, { color: theme.textMuted }]}>Coach</Text>
        </View>
      )}
    </View>
  );
}

// ─── Player modal ─────────────────────────────────────────────────────────────
function PlayerModal({ player, visible, onClose, theme }) {
  if (!player) return null;
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={[styles.playerSheet, { backgroundColor: theme.surface }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.bigJersey, { backgroundColor: player.teamColor }]}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{player.num}</Text>
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '700' }}>
                {player.nat} {player.fullName || player.name}
              </Text>
              <View style={[styles.posBadge, { backgroundColor: player.teamColor + '33' }]}>
                <Text style={{ color: player.teamColor, fontSize: 11, fontWeight: '700' }}>{player.pos}</Text>
              </View>
            </View>
            {player.rating !== 80 && (
              <View style={[styles.ratingCircle, { borderColor: '#F5D264' }]}>
                <Text style={{ color: '#F5D264', fontSize: 20, fontWeight: '700' }}>{player.rating}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', marginTop: 24, justifyContent: 'space-around' }}>
            {[['Matches', player.matches], ['Goals', player.goals], ['Assists', player.assists]].map(([l, v]) => (
              <View key={l} style={{ alignItems: 'center' }}>
                <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: '700' }}>{v}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{l.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LiveScreen() {
  const { theme } = useThemeStore();
  const {
    isLoading, error, usingMock,
    status, liveMatches, selectedMatchId,
    match, homeSquad, awaySquad, events, stats,
    upcomingMatches, finishedMatches,
    init, selectMatch, goBack, stopPolling,
  } = useMatchStore();

  const [tab, setTab] = useState('Overview');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Countdown for upcoming matches (hook always called at top level)
  const nextUpcomingDate = (status === 'UPCOMING' || status === 'IDLE')
    ? (upcomingMatches[0]?.date || match?.date)
    : null;
  const countdown = useCountdown(nextUpcomingDate);

  // Init on mount, cleanup on unmount
  useEffect(() => {
    init();
    return () => stopPolling();
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Live Match" subtitle="Loading…" />
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 60 }} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Fetching live data…</Text>
      </View>
    );
  }

  // ── Match Picker (multiple live matches, none selected) ──────────────────────
  if (status === 'LIVE' && liveMatches.length > 1 && !selectedMatchId) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ScreenHeader title="Live Now" subtitle={`${liveMatches.length} matches in progress`} />
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Choose a match to follow</Text>
        <FlatList
          data={liveMatches}
          keyExtractor={m => String(m.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <MatchPickerCard match={item} theme={theme} onPress={() => selectMatch(item.id)} />
          )}
        />
      </View>
    );
  }

  // ── IDLE Hub — no live match, show past results + upcoming ──────────────────
  if (status === 'IDLE') {
    const nextMatch = upcomingMatches[0] || match;
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ScreenHeader title="Matches" subtitle="FIFA World Cup 2026" />
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

          {/* Next match with countdown */}
          {nextMatch && nextMatch.status === 'UPCOMING' && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>NEXT MATCH</Text>
              <ScorePanel match={nextMatch} theme={theme} />
              {countdown && (
                <View style={{ marginVertical: 16 }}>
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>KICKOFF IN</Text>
                  <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
                    <CountdownTile value={countdown.days} label="DAYS"  theme={theme} />
                    <CountdownTile value={countdown.hrs}  label="HRS"   theme={theme} />
                    <CountdownTile value={countdown.mins} label="MINS"  theme={theme} />
                    <CountdownTile value={countdown.secs} label="SECS"  theme={theme} />
                  </View>
                </View>
              )}
            </>
          )}

          {/* Recent Results */}
          {finishedMatches.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 12 }]}>
                RECENT RESULTS
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
                {finishedMatches.map((m, i) => (
                  <ResultCard key={m.id || i} match={m} theme={theme} onPress={() => selectMatch(m.id)} />
                ))}
              </ScrollView>
            </>
          )}

          {/* Upcoming schedule */}
          {upcomingMatches.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>
                UPCOMING MATCHES
              </Text>
              {upcomingMatches.map((m, i) => (
                <UpcomingCard key={m.id || i} match={m} theme={theme} />
              ))}
            </>
          )}

          {/* Empty state */}
          {finishedMatches.length === 0 && upcomingMatches.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>⚽</Text>
              <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
                No Matches Yet
              </Text>
              <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 13, lineHeight: 19 }}>
                Match data will appear here once the tournament schedule is available.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Upcoming (legacy — direct upcoming) ─────────────────────────────────────
  if (status === 'UPCOMING') {
    const nextMatch = upcomingMatches[0] || match;
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ScreenHeader title="Upcoming Match" subtitle={nextMatch?.competition} />
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {/* Next match score panel (score hidden) */}
          {nextMatch && <ScorePanel match={nextMatch} theme={theme} />}

          {/* Countdown */}
          {countdown && (
            <View style={{ marginVertical: 20 }}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>KICKOFF IN</Text>
              <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
                <CountdownTile value={countdown.days} label="DAYS"  theme={theme} />
                <CountdownTile value={countdown.hrs}  label="HRS"   theme={theme} />
                <CountdownTile value={countdown.mins} label="MINS"  theme={theme} />
                <CountdownTile value={countdown.secs} label="SECS"  theme={theme} />
              </View>
            </View>
          )}

          {/* Upcoming schedule */}
          {upcomingMatches.length > 1 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>UPCOMING MATCHES</Text>
              {upcomingMatches.map((m, i) => <UpcomingCard key={m.id || i} match={m} theme={theme} />)}
            </>
          )}

          {/* Lineups (if announced) */}
          {nextMatch?.home?.lineup?.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>LINEUPS ANNOUNCED</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <BenchSection squad={nextMatch.home.lineup} color={nextMatch.home.color} coach={nextMatch.home.coach} theme={theme} />
                <BenchSection squad={nextMatch.away.lineup} color={nextMatch.away.color} coach={nextMatch.away.coach} theme={theme} />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Live + Full Time + ET + PEN (tabbed match view) ────────────────────────────
  if (!match) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Live Match" subtitle="No match data" />
        <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 60 }}>No match data available.</Text>
      </View>
    );
  }

  const isMulti = liveMatches.length > 1;

  // Build a rich status label
  let statusLabel = '';
  const minuteDisplay = match.injuryTime && match.injuryTime > 0
    ? `${match.minute}+${match.injuryTime}'`
    : `${match.minute}'`;

  if (status === 'FT') statusLabel = `Full Time · ${match.home.score}–${match.away.score}`;
  else if (status === 'HT') statusLabel = 'Half Time';
  else if (status === 'ET') statusLabel = `Extra Time ${minuteDisplay}`;
  else if (status === 'PEN') statusLabel = 'Penalty Shootout';
  else if (status === 'BREAK') statusLabel = 'Injury Break';
  else if (status === 'LIVE') statusLabel = `LIVE ${minuteDisplay}`;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader
        title={`${match.home.flag} ${match.home.code} vs ${match.away.code} ${match.away.flag}`}
        subtitle={statusLabel}
      />

      {/* Back to picker / hub button */}
      {(isMulti && selectedMatchId) || (status === 'FT' && selectedMatchId) ? (
        <TouchableOpacity onPress={goBack} style={[styles.backBtn, { borderColor: theme.border }]}>
          <Text style={{ color: theme.primary, fontWeight: '600' }}>← All Matches</Text>
        </TouchableOpacity>
      ) : null}

      {/* Mock data banner */}
      {usingMock && (
        <View style={[styles.mockBanner, { backgroundColor: '#E8A03022' }]}>
          <Text style={{ color: '#E8A030', fontSize: 12, textAlign: 'center' }}>
            ⚠ Demo data · Add your API key to .env to get live data
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <ScorePanel match={match} theme={theme} />

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
          {TABS.map(t => (
            <TouchableOpacity key={t} style={styles.tab} onPress={() => setTab(t)}>
              <Text style={{ color: tab === t ? theme.primary : theme.textSecondary, fontWeight: '600', fontSize: 13 }}>{t}</Text>
              {tab === t && <View style={[styles.tabUnder, { backgroundColor: theme.primary }]} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Overview ── */}
        {tab === 'Overview' && (
          <View style={{ padding: 16 }}>
            {/* Last 3 events */}
            {events.filter(e => !['halftime','fulltime'].includes(e.type)).slice(-3).reverse().map((e, i) => (
              <EventRow key={i} e={e} theme={theme} homeColor={match.home.color} awayColor={match.away.color} />
            ))}

            {/* Match stats */}
            {stats.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 16 }]}>MATCH STATS</Text>
                {stats.slice(0, 5).map(s => (
                  <StatBar key={s.label} stat={s} homeColor={match.home.color} awayColor={match.away.color} theme={theme} />
                ))}
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingTop: 20 }}>
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>📊 No match stats available yet</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Lineup ── */}
        {tab === 'Lineup' && (
          <View>
            {homeSquad.length > 0 && awaySquad.length > 0 ? (
              <>
                <View style={{ padding: 12 }}>
                  <FormationChart
                    homeFormation={match.home.formation}
                    awayFormation={match.away.formation}
                    homePlayers={homeSquad}
                    awayPlayers={awaySquad}
                    homeColor={match.home.color}
                    awayColor={match.away.color}
                    onPlayerPress={(p, side) =>
                      setSelectedPlayer({ ...p, side, teamColor: side === 'home' ? match.home.color : match.away.color })
                    }
                  />
                </View>
                <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <BenchSection squad={match.home.bench} color={match.home.color} coach={match.home.coach} theme={theme} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <BenchSection squad={match.away.bench} color={match.away.color} coach={match.away.coach} theme={theme} />
                  </View>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 }}>
                  Lineups Not Announced
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 40 }}>
                  Team lineups will appear here once they are officially announced before kickoff.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Stats ── */}
        {tab === 'Stats' && (
          <View style={{ padding: 16 }}>
            {stats.length > 0 ? (
              <>
                {/* Team headers */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text style={{ color: match.home.color, fontWeight: '800' }}>{match.home.flag} {match.home.name}</Text>
                  <Text style={{ color: match.away.color, fontWeight: '800' }}>{match.away.name} {match.away.flag}</Text>
                </View>
                {stats.map(s => (
                  <StatBar key={s.label} stat={s} homeColor={match.home.color} awayColor={match.away.color} theme={theme} />
                ))}
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text>
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 }}>
                  No Stats Available
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center' }}>
                  Match statistics will appear here once the match is underway.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Events ── */}
        {tab === 'Events' && (
          <View style={{ padding: 16 }}>
            {events.length === 0 ? (
              <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 40 }}>No events yet</Text>
            ) : (
              [...events].reverse().map((e, i) => (
                <EventRow key={i} e={e} theme={theme} homeColor={match.home.color} awayColor={match.away.color} />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <PlayerModal
        player={selectedPlayer}
        visible={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        theme={theme}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  fullCenter: { flex: 1 },
  loadingText: { textAlign: 'center', marginTop: 12, fontSize: 14 },

  // Score panel
  scorePanel: { margin: 16, padding: 16, borderRadius: 16, borderTopWidth: 3 },
  competitionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textAlign: 'center', marginBottom: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  teamCol: { flex: 1, alignItems: 'center' },
  scoreCol: { flex: 1.2, alignItems: 'center' },
  jersey: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  jNum: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  teamName: { fontWeight: '700', fontSize: 13, textAlign: 'center', marginBottom: 2 },
  formation: { fontSize: 11 },
  bigScore: { fontSize: 40, fontWeight: '900', letterSpacing: 2 },
  vsText: { fontSize: 24, fontWeight: '900', letterSpacing: 3 },
  kickoffTime: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  venueLabel: { fontSize: 11, textAlign: 'center', marginTop: 8 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  livePillTxt: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  pulseDot: { width: 7, height: 7, borderRadius: 4 },

  // Tabs
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabUnder: { position: 'absolute', bottom: 0, height: 2, width: 28, borderRadius: 1 },

  // Events
  eventRow: { marginBottom: 8, gap: 8 },
  minuteBadge: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0, alignSelf: 'flex-start' },
  minuteText: { fontWeight: '800', fontSize: 12 },
  eventCard: { flex: 1, borderRadius: 10, padding: 10 },
  eventPlayer: { fontWeight: '700', fontSize: 14 },
  eventDesc: { fontSize: 12, marginTop: 2 },
  eventTeamDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 8 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '700' },

  // Stats
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },

  // Countdown
  countdownTile: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12 },
  countdownNum: { fontSize: 28, fontWeight: '900' },
  countdownLabel: { fontSize: 10, fontWeight: '600', marginTop: 4 },

  // Picker
  pickerCard: { borderRadius: 14, padding: 14, borderWidth: 1 },
  pickerTeam: { fontWeight: '700', fontSize: 14, textAlign: 'center', flex: 1 },
  pickerScore: { fontSize: 20, fontWeight: '900' },
  pickerCompetition: { fontSize: 11, textAlign: 'center', marginTop: 8 },
  upcomingCard: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10 },
  upcomingTime: { fontWeight: '700', fontSize: 16 },

  // Result cards
  resultCard: {
    width: 140, borderRadius: 14, padding: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  resultTeamRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultTeam: { fontSize: 20 },
  resultTeamCode: { fontSize: 12, fontWeight: '800' },
  resultCenter: { alignItems: 'center', marginVertical: 8 },
  resultScore: { fontSize: 20, fontWeight: '900' },
  ftBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  ftBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  resultDate: { fontSize: 10, fontWeight: '600' },

  // Bench
  benchBox: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10 },
  benchTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  benchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  benchNum: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  benchName: { flex: 1, fontSize: 12, fontWeight: '600' },
  benchPos: { fontSize: 10, fontWeight: '700' },

  // Player modal
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  playerSheet: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 48 },
  bigJersey: { width: 60, height: 60, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  posBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  ratingCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },

  // Nav
  backBtn: { marginHorizontal: 16, marginBottom: 4, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, alignSelf: 'flex-start' },
  mockBanner: { marginHorizontal: 16, marginBottom: 4, padding: 8, borderRadius: 8 },
});
