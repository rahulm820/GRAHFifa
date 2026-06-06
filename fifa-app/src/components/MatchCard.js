// ─────────────────────────────────────────────────────────────────────────────
// MatchCard.js — Reusable match list card
// Shows teams, score, status badge, and group label
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { ACTIVE_STATUSES } from '../utils/matchUtils';

function PulseDot({ color }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.dot, { backgroundColor: color, opacity: anim }]} />;
}

const STATUS_CONFIG = {
  LIVE:  { bg: '#e84040', text: null, showDot: true },
  HT:    { bg: '#E8A030', text: 'HT', showDot: false },
  ET:    { bg: '#C77DFF', text: null, showDot: true },
  PEN:   { bg: '#7B2FF7', text: 'PEN', showDot: true },
  BREAK: { bg: '#E8A030', text: 'BRK', showDot: true },
  FT:    { bg: '#6B6B62', text: 'FT', showDot: false },
};

export default function MatchCard({ match, onPress }) {
  const { theme } = useThemeStore();
  const isActive = ACTIVE_STATUSES.includes(match.status);
  const isUpcoming = match.status === 'UPCOMING';
  const cfg = STATUS_CONFIG[match.status] || STATUS_CONFIG.FT;

  const minuteDisplay = match.injuryTime && match.injuryTime > 0
    ? `${match.minute}+${match.injuryTime}'`
    : `${match.minute}'`;

  const kickoff = isUpcoming ? new Date(match.date) : null;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Group / Stage label */}
      <View style={styles.topRow}>
        <Text style={[styles.groupLabel, { color: theme.textMuted }]} numberOfLines={1}>
          {match.group || match.stage || match.competition}
        </Text>
        {/* Status badge */}
        {isUpcoming ? (
          <View style={[styles.badge, { backgroundColor: theme.primary + '22' }]}>
            <Text style={[styles.badgeText, { color: theme.primary }]}>
              {kickoff.toLocaleDateString([], { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            {cfg.showDot && <PulseDot color="#fff" />}
            <Text style={styles.badgeTextWhite}>
              {cfg.text || minuteDisplay}
            </Text>
          </View>
        )}
      </View>

      {/* Teams and Score */}
      <View style={styles.matchRow}>
        {/* Home team */}
        <View style={styles.teamSide}>
          <View style={[styles.teamBadge, { backgroundColor: match.home.color }]}>
            <Text style={styles.teamBadgeText}>{match.home.code}</Text>
          </View>
          <Text style={[styles.teamName, { color: theme.textPrimary }]} numberOfLines={1}>
            {match.home.flag} {match.home.name}
          </Text>
        </View>

        {/* Score / VS */}
        <View style={styles.scoreCenter}>
          {isUpcoming ? (
            <Text style={[styles.vsText, { color: theme.textMuted }]}>VS</Text>
          ) : (
            <Text style={[styles.scoreText, { color: theme.textPrimary }]}>
              {match.home.score} — {match.away.score}
            </Text>
          )}
          {match.etScore && (
            <Text style={{ color: theme.textMuted, fontSize: 9, marginTop: 2 }}>AET</Text>
          )}
          {match.penScore && (
            <Text style={{ color: '#7B2FF7', fontSize: 9, fontWeight: '700', marginTop: 1 }}>
              PEN {match.penScore}
            </Text>
          )}
        </View>

        {/* Away team */}
        <View style={[styles.teamSide, { alignItems: 'flex-end' }]}>
          <View style={[styles.teamBadge, { backgroundColor: match.away.color }]}>
            <Text style={styles.teamBadgeText}>{match.away.code}</Text>
          </View>
          <Text style={[styles.teamName, { color: theme.textPrimary }]} numberOfLines={1}>
            {match.away.name} {match.away.flag}
          </Text>
        </View>
      </View>

      {/* Venue */}
      {match.venue && match.venue !== 'TBD' && (
        <Text style={[styles.venue, { color: theme.textMuted }]} numberOfLines={1}>
          📍 {match.venue}
        </Text>
      )}

      {/* Upcoming time */}
      {isUpcoming && kickoff && (
        <Text style={[styles.venue, { color: theme.primary }]}>
          🕐 {kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextWhite: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSide: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 6,
  },
  teamBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '700',
  },
  scoreCenter: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  vsText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  venue: {
    fontSize: 10,
    marginTop: 10,
    textAlign: 'center',
  },
});
