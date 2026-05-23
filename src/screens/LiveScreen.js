import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import FormationChart from '../components/FormationChart';
import { useThemeStore } from '../store/themeStore';
import { useMatchStore } from '../store/matchStore';

const TABS = ['Overview', 'Lineup', 'Stats', 'Timeline'];

export default function LiveScreen() {
  const { theme } = useThemeStore();
  const { match, events, stats, homeSquad, awaySquad } = useMatchStore();
  const [tab, setTab] = useState('Lineup');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title={match.competition} subtitle={`${match.venue} · LIVE ${match.minute}'`} />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Score panel */}
        <View style={[styles.scorePanel, { backgroundColor: theme.surface, borderTopColor: theme.primary }]}>
          <View style={styles.teamCol}>
            <View style={[styles.jersey, { backgroundColor: match.home.color }]}><Text style={styles.jNum}>10</Text></View>
            <Text style={[styles.teamName, { color: theme.textPrimary }]}>{match.home.flag} {match.home.name}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>{match.home.formation}</Text>
          </View>
          <View style={styles.scoreCol}>
            <Text style={[styles.bigScore, { color: theme.textPrimary }]}>{match.home.score} — {match.away.score}</Text>
            <View style={[styles.pill, { backgroundColor: theme.primary }]}><Text style={styles.pillTxt}>{match.half}</Text></View>
            <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>HT {match.htScore}</Text>
          </View>
          <View style={styles.teamCol}>
            <View style={[styles.jersey, { backgroundColor: match.away.color }]}><Text style={styles.jNum}>10</Text></View>
            <Text style={[styles.teamName, { color: theme.textPrimary }]}>{match.away.flag} {match.away.name}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>{match.away.formation}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
          {TABS.map(t => (
            <TouchableOpacity key={t} style={styles.tab} onPress={() => setTab(t)}>
              <Text style={{ color: tab === t ? theme.primary : theme.textSecondary, fontWeight: '600' }}>{t}</Text>
              {tab === t && <View style={[styles.tabUnder, { backgroundColor: theme.accent }]} />}
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'Overview' && (
          <View style={{ padding: 16 }}>
            {stats.slice(0, 5).map(s => (
              <StatBar key={s.label} stat={s} theme={theme} homeColor={match.home.color} awayColor={match.away.color} />
            ))}
          </View>
        )}

        {tab === 'Lineup' && (
          <View style={{ padding: 12 }}>
            <FormationChart
              homeFormation={match.home.formation}
              awayFormation={match.away.formation}
              homePlayers={homeSquad}
              awayPlayers={awaySquad}
              homeColor={match.home.color}
              awayColor={match.away.color}
              onPlayerPress={(p, side) => setSelectedPlayer({ ...p, side, teamColor: side === 'home' ? match.home.color : match.away.color })}
            />
          </View>
        )}

        {tab === 'Stats' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
            {stats.map(s => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: theme.surface, borderTopColor: theme.primary }]}>
                <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</Text>
                <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: '700', marginTop: 8 }}>
                  {s.home}{s.unit || ''} <Text style={{ color: theme.textMuted }}>vs</Text> {s.away}{s.unit || ''}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        {tab === 'Timeline' && (
          <View style={{ padding: 16 }}>
            {events.map((e, i) => (
              <TimelineRow key={i} e={e} theme={theme} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Player profile sheet */}
      <Modal transparent visible={!!selectedPlayer} animationType="slide" onRequestClose={() => setSelectedPlayer(null)}>
        <TouchableOpacity activeOpacity={1} style={styles.sheetBackdrop} onPress={() => setSelectedPlayer(null)}>
          {selectedPlayer && (
            <View style={[styles.playerSheet, { backgroundColor: theme.surface }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.bigJersey, { backgroundColor: selectedPlayer.teamColor }]}>
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{selectedPlayer.num}</Text>
                </View>
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '700' }}>{selectedPlayer.nat} {selectedPlayer.name}</Text>
                  <View style={[styles.posBadge, { backgroundColor: theme.surfaceElevated }]}>
                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600' }}>{selectedPlayer.pos}</Text>
                  </View>
                </View>
                <View style={[styles.ratingCircle, { borderColor: theme.accent }]}>
                  <Text style={{ color: theme.accent, fontSize: 20, fontWeight: '700' }}>{selectedPlayer.rating}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 24, justifyContent: 'space-around' }}>
                <StatBlock label="Matches" value={selectedPlayer.matches} theme={theme} />
                <StatBlock label="Goals" value={selectedPlayer.goals} theme={theme} />
                <StatBlock label="Assists" value={selectedPlayer.assists} theme={theme} />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const StatBlock = ({ label, value, theme }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: '700' }}>{value}</Text>
    <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{label.toUpperCase()}</Text>
  </View>
);

const StatBar = ({ stat, theme, homeColor, awayColor }) => {
  const total = stat.home + stat.away || 1;
  const homePct = (stat.home / total) * 100;
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>{stat.home}{stat.unit || ''}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{stat.label}</Text>
        <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>{stat.away}{stat.unit || ''}</Text>
      </View>
      <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: theme.border }}>
        <View style={{ width: `${homePct}%`, backgroundColor: homeColor }} />
        <View style={{ flex: 1, backgroundColor: awayColor }} />
      </View>
    </View>
  );
};

const TimelineRow = ({ e, theme }) => {
  const colors = { goal: theme.success, yellow: '#E8C53A', red: theme.danger, sub: '#4A90E2', halftime: theme.textMuted };
  const icons = { goal: '⚽', yellow: '🟨', red: '🟥', sub: '🔄', halftime: '⏱' };
  if (e.type === 'halftime') {
    return <Text style={{ color: theme.textMuted, textAlign: 'center', marginVertical: 8 }}>— {e.desc} —</Text>;
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderLeftWidth: 3, borderLeftColor: colors[e.type], paddingLeft: 12 }}>
      <Text style={{ color: theme.textPrimary, fontWeight: '700', width: 36 }}>{e.minute}'</Text>
      <Text style={{ fontSize: 16, marginRight: 8 }}>{icons[e.type]}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>{e.player}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{e.desc}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scorePanel: { margin: 16, padding: 16, borderRadius: 12, borderTopWidth: 3, flexDirection: 'row', alignItems: 'center' },
  teamCol: { flex: 1, alignItems: 'center' },
  scoreCol: { flex: 1.2, alignItems: 'center' },
  jersey: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  jNum: { color: '#fff', fontWeight: '700', fontSize: 18 },
  teamName: { fontWeight: '700', fontSize: 13, textAlign: 'center' },
  bigScore: { fontSize: 36, fontWeight: '700' },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginTop: 6 },
  pillTxt: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabUnder: { position: 'absolute', bottom: 0, height: 2, width: 32, borderRadius: 1 },
  statCard: { padding: 16, borderRadius: 12, minWidth: 140, borderTopWidth: 2 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  playerSheet: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  bigJersey: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  posBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  ratingCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
});
