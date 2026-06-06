// ─────────────────────────────────────────────────────────────────────────────
// LiveScreen.js — Tab-based match hub
// Tabs: Completed | Live | Upcoming → MatchCard list → MatchDetailSheet
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import HorizontalTabBar from '../components/HorizontalTabBar';
import MatchCard from '../components/MatchCard';
import MatchDetailSheet from '../components/MatchDetailSheet';
import { useThemeStore } from '../store/themeStore';
import { useMatchStore } from '../store/matchStore';
import { useMatchData } from '../hooks/useMatchData';

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function SkeletonCard({ theme }) {
  return (
    <View style={[styles.skeleton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.skelLine, { backgroundColor: theme.border, width: '40%' }]} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
        <View style={[styles.skelCircle, { backgroundColor: theme.border }]} />
        <View style={[styles.skelLine, { backgroundColor: theme.border, width: '20%', height: 28 }]} />
        <View style={[styles.skelCircle, { backgroundColor: theme.border }]} />
      </View>
      <View style={[styles.skelLine, { backgroundColor: theme.border, width: '60%', marginTop: 10, alignSelf: 'center' }]} />
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
const EMPTY_STATES = {
  LIVE: {
    emoji: '📡',
    title: 'No Live Matches',
    desc: 'There are no matches being played right now.\nCheck back during match days!',
  },
  FINISHED: {
    emoji: '🏆',
    title: 'No Results Yet',
    desc: 'Completed match results will appear here\nonce the tournament kicks off.',
  },
  SCHEDULED: {
    emoji: '📅',
    title: 'No Upcoming Matches',
    desc: 'The match schedule will appear here\nonce fixtures are announced.',
  },
};

function EmptyState({ tab, theme }) {
  const state = EMPTY_STATES[tab] || EMPTY_STATES.LIVE;
  return (
    <View style={styles.emptyCenter}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>{state.emoji}</Text>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{state.title}</Text>
      <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>{state.desc}</Text>
    </View>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry, theme }) {
  return (
    <View style={styles.emptyCenter}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Something went wrong</Text>
      <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>{message}</Text>
      <TouchableOpacity
        style={[styles.retryBtn, { backgroundColor: theme.primary }]}
        onPress={onRetry}
      >
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LiveScreen() {
  const { theme } = useThemeStore();
  const { setScreenContext } = useMatchStore();
  const [activeTab, setActiveTab] = useState('LIVE');
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const { matches, isLoading, error, hasLive, refresh } = useMatchData(activeTab);

  // Handle tab change
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setScreenContext({ current_tab: tab, selected_match: null });
  }, [setScreenContext]);

  // Handle card press → open detail
  const handleMatchPress = useCallback((match) => {
    setSelectedMatchId(match.id);
    setDetailVisible(true);
    setScreenContext({
      current_tab: activeTab,
      selected_match: {
        match_id: match.id,
        home_team: match.home.name,
        away_team: match.away.name,
        score: match.status !== 'UPCOMING' ? `${match.home.score}–${match.away.score}` : null,
        minute: match.minute,
        status: match.status,
        competition: match.competition,
      },
    });
  }, [activeTab, setScreenContext]);

  // Close detail
  const handleCloseDetail = useCallback(() => {
    setDetailVisible(false);
    setSelectedMatchId(null);
    setScreenContext({ current_tab: activeTab, selected_match: null });
  }, [activeTab, setScreenContext]);

  // Tab subtitle
  const getSubtitle = () => {
    if (isLoading) return 'Loading…';
    if (error) return 'Error loading data';
    if (matches.length === 0) return 'No matches';
    if (activeTab === 'LIVE') return `${matches.length} live match${matches.length > 1 ? 'es' : ''}`;
    if (activeTab === 'FINISHED') return `${matches.length} result${matches.length > 1 ? 's' : ''}`;
    return `${matches.length} match${matches.length > 1 ? 'es' : ''} scheduled`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="Matches" subtitle={getSubtitle()} />

      <HorizontalTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasLive={hasLive}
      />

      {/* Loading */}
      {isLoading ? (
        <View style={{ padding: 16 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} theme={theme} />)}
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} theme={theme} />
      ) : matches.length === 0 ? (
        <EmptyState tab={activeTab} theme={theme} />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={m => String(m.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <MatchCard match={item} onPress={() => handleMatchPress(item)} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        />
      )}

      {/* Match Detail Sheet */}
      <MatchDetailSheet
        matchId={selectedMatchId}
        visible={detailVisible}
        onClose={handleCloseDetail}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Skeleton
  skeleton: {
    borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1,
  },
  skelLine: {
    height: 12, borderRadius: 6,
  },
  skelCircle: {
    width: 36, height: 36, borderRadius: 10,
  },

  // Empty / Error
  emptyCenter: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13, textAlign: 'center', lineHeight: 20,
  },
  retryBtn: {
    marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF', fontWeight: '700', fontSize: 14,
  },
});
