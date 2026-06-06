// ─────────────────────────────────────────────────────────────────────────────
// MatchDetailSheet.js — Full-screen match detail modal
// Shows score panel, events timeline, stats, venue, referee
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  ActivityIndicator, StyleSheet, Animated,
} from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { fetchMatchById } from '../api/footballApi';
import { mapMatch, mapEvents, mapStats, ACTIVE_STATUSES } from '../utils/matchUtils';
import FormationChart from './FormationChart';

const TABS = ['Overview', 'Lineup', 'Stats', 'Events'];

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

const STATUS_PILL = {
  LIVE:  { bg: '#e84040', label: null, showDot: true },
  HT:    { bg: '#E8A030', label: 'HALF TIME', showDot: false },
  ET:    { bg: '#C77DFF', label: null, showDot: true },
  PEN:   { bg: '#7B2FF7', label: 'PENALTIES', showDot: true },
  BREAK: { bg: '#E8A030', label: 'BREAK', showDot: true },
  FT:    { bg: null, label: 'FULL TIME', showDot: false, useMuted: true },
};

const EVENT_META = {
  goal:     { icon: '⚽', bg: '#1A7A3C22', border: '#1A7A3C' },
  yellow:   { icon: '🟨', bg: '#E8C53A22', border: '#E8C53A' },
  red:      { icon: '🟥', bg: '#E8404022', border: '#E84040' },
  red2:     { icon: '🟥', bg: '#E8404022', border: '#E84040' },
  sub:      { icon: '🔄', bg: '#4A90E222', border: '#4A90E2' },
};

// ─── Event Row ────────────────────────────────────────────────────────────────
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
      <View style={[styles.minuteBadge, { backgroundColor: meta.border + '22' }]}>
        <Text style={[styles.minuteText, { color: meta.border }]}>{e.minute}'</Text>
      </View>
      <View style={[styles.eventCard, { backgroundColor: meta.bg,
        borderLeftColor: isHome ? meta.border : 'transparent',
        borderRightColor: isHome ? 'transparent' : meta.border,
        borderLeftWidth: isHome ? 3 : 0, borderRightWidth: isHome ? 0 : 3 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>{meta.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eventPlayer, { color: theme.textPrimary }]}>
              {e.player}
              {e.type === 'goal' && e.assist && (
                <Text style={{ color: theme.textSecondary, fontWeight: '400', fontSize: 12 }}> · {e.assist}</Text>
              )}
            </Text>
            {e.type === 'sub' ? (
              <Text style={[styles.eventDesc, { color: theme.textSecondary }]}>
                ⬆ {e.playerIn}  ⬇ {e.playerOut}
              </Text>
            ) : (
              <Text style={[styles.eventDesc, { color: theme.textSecondary }]}>{e.desc}</Text>
            )}
          </View>
          <View style={[styles.teamDot, { backgroundColor: isHome ? homeColor : awayColor }]} />
        </View>
      </View>
    </View>
  );
}

// ─── Stat Bar ─────────────────────────────────────────────────────────────────
function StatBar({ stat, homeColor, awayColor, theme }) {
  const total = (stat.home + stat.away) || 1;
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

// ─── Bench Section ────────────────────────────────────────────────────────────
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
        </View>
      )}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MatchDetailSheet({ matchId, visible, onClose }) {
  const { theme } = useThemeStore();
  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('Overview');
  const pollRef = useRef(null);

  // Fetch match details
  useEffect(() => {
    if (!visible || !matchId) return;
    setIsLoading(true);
    setError(null);
    setTab('Overview');

    const load = async () => {
      try {
        const raw = await fetchMatchById(matchId);
        setMatch(mapMatch(raw));
        setEvents(mapEvents(raw));
        setStats(mapStats(raw));
        setIsLoading(false);

        // Poll if live
        const status = raw.status;
        if (['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT', 'BREAK'].includes(status)) {
          pollRef.current = setInterval(async () => {
            try {
              const updated = await fetchMatchById(matchId);
              setMatch(mapMatch(updated));
              setEvents(mapEvents(updated));
              setStats(mapStats(updated));
              if (updated.status === 'FINISHED') clearInterval(pollRef.current);
            } catch { /* silent */ }
          }, 30000);
        }
      } catch (e) {
        setError(e.message);
        setIsLoading(false);
      }
    };
    load();

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [matchId, visible]);

  const pill = match ? (STATUS_PILL[match.status] || {}) : {};
  const minuteDisplay = match?.injuryTime && match.injuryTime > 0
    ? `${match.minute}+${match.injuryTime}'`
    : `${match?.minute}'`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '700' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {match ? `${match.home.flag} ${match.home.code} vs ${match.away.code} ${match.away.flag}` : 'Match Details'}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {isLoading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading match data…</Text>
          </View>
        ) : error ? (
          <View style={styles.centerFill}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
            <Text style={{ color: theme.textPrimary, fontWeight: '700', marginBottom: 6 }}>Error</Text>
            <Text style={{ color: theme.textSecondary, textAlign: 'center', paddingHorizontal: 40 }}>{error}</Text>
          </View>
        ) : match ? (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Score Panel */}
            <View style={[styles.scorePanel, { backgroundColor: theme.surface, borderTopColor: match.home.color }]}>
              <Text style={[styles.competitionLabel, { color: theme.textMuted }]}>
                {match.competition?.toUpperCase()} {match.group ? `· ${match.group}` : ''} {match.stage ? `· ${match.stage}` : ''}
              </Text>

              <View style={styles.scoreRow}>
                <View style={styles.teamCol}>
                  <View style={[styles.jersey, { backgroundColor: match.home.color }]}>
                    <Text style={styles.jerseyText}>{match.home.code}</Text>
                  </View>
                  <Text style={[styles.scoreName, { color: theme.textPrimary }]}>{match.home.flag} {match.home.name}</Text>
                  {match.home.formation && <Text style={{ color: theme.textMuted, fontSize: 11 }}>{match.home.formation}</Text>}
                </View>

                <View style={styles.scoreCol}>
                  {match.status === 'UPCOMING' ? (
                    <>
                      <Text style={[styles.vsText, { color: theme.textSecondary }]}>VS</Text>
                      <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16, marginTop: 4 }}>
                        {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.bigScore, { color: theme.textPrimary }]}>
                        {match.home.score} — {match.away.score}
                      </Text>
                      {pill.bg && (
                        <View style={[styles.statusPill, { backgroundColor: pill.useMuted ? theme.textMuted : pill.bg }]}>
                          {pill.showDot && <PulseDot color="#fff" />}
                          <Text style={styles.statusPillText}>{pill.label || `${minuteDisplay} ${match.half}`}</Text>
                        </View>
                      )}
                      {match.etScore && <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>AET {match.etScore}</Text>}
                      {match.penScore && <Text style={{ color: '#7B2FF7', fontSize: 11, marginTop: 2, fontWeight: '700' }}>PEN {match.penScore}</Text>}
                      {match.htScore && <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>HT {match.htScore}</Text>}
                    </>
                  )}
                </View>

                <View style={styles.teamCol}>
                  <View style={[styles.jersey, { backgroundColor: match.away.color }]}>
                    <Text style={styles.jerseyText}>{match.away.code}</Text>
                  </View>
                  <Text style={[styles.scoreName, { color: theme.textPrimary }]}>{match.away.flag} {match.away.name}</Text>
                  {match.away.formation && <Text style={{ color: theme.textMuted, fontSize: 11 }}>{match.away.formation}</Text>}
                </View>
              </View>

              {/* Info row */}
              <View style={styles.infoRow}>
                {match.venue && match.venue !== 'TBD' && (
                  <Text style={[styles.infoText, { color: theme.textMuted }]}>📍 {match.venue}</Text>
                )}
                {match.date && (
                  <Text style={[styles.infoText, { color: theme.textMuted }]}>
                    📅 {new Date(match.date).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                )}
                {match.referees?.length > 0 && (
                  <Text style={[styles.infoText, { color: theme.textMuted }]}>🧑‍⚖️ {match.referees[0]}</Text>
                )}
              </View>
            </View>

            {/* Detail Tabs */}
            <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
              {TABS.map(t => (
                <TouchableOpacity key={t} style={styles.tabItem} onPress={() => setTab(t)}>
                  <Text style={{ color: tab === t ? theme.primary : theme.textSecondary, fontWeight: '600', fontSize: 13 }}>{t}</Text>
                  {tab === t && <View style={[styles.tabUnder, { backgroundColor: theme.primary }]} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Overview */}
            {tab === 'Overview' && (
              <View style={{ padding: 16 }}>
                {events.filter(e => !['halftime','fulltime'].includes(e.type)).slice(-3).reverse().map((e, i) => (
                  <EventRow key={i} e={e} theme={theme} homeColor={match.home.color} awayColor={match.away.color} />
                ))}
                {stats.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 16 }]}>MATCH STATS</Text>
                    {stats.slice(0, 5).map(s => (
                      <StatBar key={s.label} stat={s} homeColor={match.home.color} awayColor={match.away.color} theme={theme} />
                    ))}
                  </>
                )}
                {events.length === 0 && stats.length === 0 && (
                  <View style={{ alignItems: 'center', paddingTop: 40 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 13 }}>No match data available yet</Text>
                  </View>
                )}
              </View>
            )}

            {/* Lineup */}
            {tab === 'Lineup' && (
              <View>
                {match.home.lineup?.length > 0 && match.away.lineup?.length > 0 ? (
                  <>
                    <View style={{ padding: 12 }}>
                      <FormationChart
                        homeFormation={match.home.formation}
                        awayFormation={match.away.formation}
                        homePlayers={match.home.lineup}
                        awayPlayers={match.away.lineup}
                        homeColor={match.home.color}
                        awayColor={match.away.color}
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
                    <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 }}>Lineups Not Announced</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 40 }}>
                      Lineups appear once officially announced before kickoff.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Stats */}
            {tab === 'Stats' && (
              <View style={{ padding: 16 }}>
                {stats.length > 0 ? (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                      <Text style={{ color: match.home.color, fontWeight: '800' }}>{match.home.flag} {match.home.name}</Text>
                      <Text style={{ color: match.away.color, fontWeight: '800' }}>{match.away.name} {match.away.flag}</Text>
                    </View>
                    {stats.map(s => <StatBar key={s.label} stat={s} homeColor={match.home.color} awayColor={match.away.color} theme={theme} />)}
                  </>
                ) : (
                  <View style={{ alignItems: 'center', paddingTop: 60 }}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text>
                    <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 }}>No Stats Available</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center' }}>
                      Statistics will appear once the match is underway.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Events */}
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
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 60 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  scorePanel: { margin: 16, padding: 16, borderRadius: 16, borderTopWidth: 3 },
  competitionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textAlign: 'center', marginBottom: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  teamCol: { flex: 1, alignItems: 'center' },
  scoreCol: { flex: 1.2, alignItems: 'center' },
  jersey: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  jerseyText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  scoreName: { fontWeight: '700', fontSize: 13, textAlign: 'center', marginBottom: 2 },
  bigScore: { fontSize: 38, fontWeight: '900', letterSpacing: 2 },
  vsText: { fontSize: 24, fontWeight: '900', letterSpacing: 3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusPillText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  pulseDot: { width: 7, height: 7, borderRadius: 4 },

  infoRow: { marginTop: 12, gap: 4 },
  infoText: { fontSize: 11, textAlign: 'center' },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: 16 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabUnder: { position: 'absolute', bottom: 0, height: 2, width: 28, borderRadius: 1 },

  eventRow: { marginBottom: 8, gap: 8 },
  minuteBadge: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0, alignSelf: 'flex-start' },
  minuteText: { fontWeight: '800', fontSize: 12 },
  eventCard: { flex: 1, borderRadius: 10, padding: 10 },
  eventPlayer: { fontWeight: '700', fontSize: 14 },
  eventDesc: { fontSize: 12, marginTop: 2 },
  teamDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 8 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '700' },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },

  benchBox: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10 },
  benchTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  benchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  benchNum: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  benchName: { flex: 1, fontSize: 12, fontWeight: '600' },
  benchPos: { fontSize: 10, fontWeight: '700' },
});
