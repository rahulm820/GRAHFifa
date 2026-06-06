import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Animated, PanResponder, TouchableOpacity, Dimensions, StyleSheet, Modal } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { useMatchStore } from '../store/matchStore';

const { width: SW } = Dimensions.get('window');

const ACTIVE_STATUSES = ['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT', 'BREAK'];

export default function LiveScoreCapsule() {
  const { theme } = useThemeStore();
  const { isLive, liveMatch, checkLive } = useMatchStore();
  const pan = useRef(new Animated.ValueXY({ x: SW - 200, y: 60 })).current;
  const [open, setOpen] = useState(false);

  // Poll for live matches every 60s
  useEffect(() => {
    checkLive();
    const t = setInterval(checkLive, 60_000);
    return () => clearInterval(t);
  }, []);

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => pan.flattenOffset(),
    })
  ).current;

  if (!isLive || !liveMatch) return null;

  return (
    <>
      <Animated.View
        {...responder.panHandlers}
        style={[
          styles.capsule,
          {
            backgroundColor: theme.isDark ? 'rgba(20,40,20,0.92)' : 'rgba(255,255,255,0.95)',
            borderColor: theme.primary,
            shadowColor: '#000',
          },
          { transform: pan.getTranslateTransform() },
        ]}
      >
        <TouchableOpacity onPress={() => setOpen(true)} style={styles.inner}>
          <View style={[styles.dot, { backgroundColor: '#e84040' }]} />
          <Text style={[styles.team, { color: theme.textPrimary }]}>{liveMatch.home?.code ?? '—'}</Text>
          <Text style={[styles.score, { color: theme.accent }]}>
            {liveMatch.home?.score ?? 0}–{liveMatch.away?.score ?? 0}
          </Text>
          <Text style={[styles.team, { color: theme.textPrimary }]}>{liveMatch.away?.code ?? '—'}</Text>
          <Text style={[styles.min, { color: theme.primary }]}>{liveMatch.minute ?? 0}'</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal transparent visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
            <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
              {liveMatch.home?.code}  {liveMatch.home?.score ?? 0} — {liveMatch.away?.score ?? 0}  {liveMatch.away?.code}
            </Text>
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8 }}>
              {liveMatch.status} · {liveMatch.minute ?? 0}'
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  capsule: {
    position: 'absolute', width: 180, height: 38, borderRadius: 19, zIndex: 9999,
    borderWidth: 1, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  inner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  team: { fontWeight: '700', fontSize: 12 },
  score: { fontWeight: '700', fontSize: 14 },
  min: { fontSize: 11, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
});
