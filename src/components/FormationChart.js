import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Line, Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { useThemeStore } from '../store/themeStore';

// Parses "4-3-3" -> [4,3,3]. Returns rows including GK as first item.
const parseFormation = (f) => [1, ...f.split('-').map(Number)];

// Compute (x, y) percentages for each player given formation rows.
// side = 'home' (bottom half) or 'away' (top half, mirrored).
function layoutPlayers(rows, side) {
  // y bands within the team's half (0..1 of half)
  // GK 10%, DEF 28%, MID 50%, ATT 82% — for half of pitch
  const bandCount = rows.length;
  // For 4-row formation [GK, DEF, MID, ATT]: bands at 0.10, 0.30, 0.55, 0.82
  // For 5-row [GK, DEF, M1, M2, ATT]: 0.10, 0.25, 0.45, 0.62, 0.82
  // For 6-row [GK, DEF, M1, M2, M3, ATT]: 0.10, 0.22, 0.38, 0.52, 0.68, 0.85
  const bandPresets = {
    3: [0.10, 0.45, 0.82],
    4: [0.10, 0.30, 0.58, 0.85],
    5: [0.10, 0.25, 0.45, 0.65, 0.85],
    6: [0.08, 0.22, 0.38, 0.54, 0.70, 0.86],
  };
  const bands = bandPresets[bandCount] || bandPresets[4];

  const result = [];
  rows.forEach((count, rowIdx) => {
    const bandY = bands[rowIdx];
    // Within row, distribute evenly across width with side padding
    for (let i = 0; i < count; i++) {
      const xPct = count === 1 ? 0.5 : 0.10 + (0.80 * i) / (count - 1);
      // side: home occupies bottom half (y 0.5..1), away top half (y 0..0.5, mirrored)
      const yInHalf = bandY * 0.5; // map to 0..0.5
      const y = side === 'home' ? 1 - yInHalf : yInHalf;
      result.push({ x: xPct, y, rowIdx, isGK: rowIdx === 0 });
    }
  });
  return result;
}

const PITCH_W = 340;
const PITCH_H = PITCH_W * (105 / 68);

function PitchSVG({ theme }) {
  const line = 'rgba(255,255,255,0.7)';
  const stripeCount = 10;
  const stripes = Array.from({ length: stripeCount }).map((_, i) => (
    <Rect
      key={i}
      x={0}
      y={(i * PITCH_H) / stripeCount}
      width={PITCH_W}
      height={PITCH_H / stripeCount}
      fill={i % 2 === 0 ? '#1F6B36' : '#1A5C2E'}
    />
  ));
  return (
    <Svg width={PITCH_W} height={PITCH_H} style={{ borderRadius: 12, overflow: 'hidden' }}>
      <Defs>
        <LinearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1F6B36" />
          <Stop offset="1" stopColor="#155028" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={PITCH_W} height={PITCH_H} rx={12} fill="url(#pg)" />
      {stripes}
      {/* outer */}
      <Rect x="6" y="6" width={PITCH_W - 12} height={PITCH_H - 12} fill="none" stroke={line} strokeWidth="1.5" rx="6" />
      {/* center line */}
      <Line x1="6" y1={PITCH_H / 2} x2={PITCH_W - 6} y2={PITCH_H / 2} stroke={line} strokeWidth="1.5" />
      {/* center circle + spot */}
      <Circle cx={PITCH_W / 2} cy={PITCH_H / 2} r="40" fill="none" stroke={line} strokeWidth="1.5" />
      <Circle cx={PITCH_W / 2} cy={PITCH_H / 2} r="2" fill={line} />
      {/* penalty areas */}
      <Rect x={PITCH_W * 0.18} y="6" width={PITCH_W * 0.64} height="55" fill="none" stroke={line} strokeWidth="1.5" />
      <Rect x={PITCH_W * 0.18} y={PITCH_H - 61} width={PITCH_W * 0.64} height="55" fill="none" stroke={line} strokeWidth="1.5" />
      {/* goal areas */}
      <Rect x={PITCH_W * 0.32} y="6" width={PITCH_W * 0.36} height="22" fill="none" stroke={line} strokeWidth="1.5" />
      <Rect x={PITCH_W * 0.32} y={PITCH_H - 28} width={PITCH_W * 0.36} height="22" fill="none" stroke={line} strokeWidth="1.5" />
      {/* penalty spots */}
      <Circle cx={PITCH_W / 2} cy="42" r="2" fill={line} />
      <Circle cx={PITCH_W / 2} cy={PITCH_H - 42} r="2" fill={line} />
    </Svg>
  );
}

function PlayerMarker({ x, y, player, color, onPress, delay }) {
  const scale = useSharedValue(0);
  React.useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 12 }));
  }, []);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.markerWrap, { left: x - 24, top: y - 24 }, aStyle]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.marker, { backgroundColor: color, borderRadius: player.isGK ? 6 : 16 }]}>
          <Text style={styles.markerNum}>{player.num}</Text>
        </View>
        <Text style={styles.markerName} numberOfLines={1}>{player.name.slice(0, 10)}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function FormationChart({ homeFormation, awayFormation, homePlayers, awayPlayers, homeColor, awayColor, onPlayerPress }) {
  const { theme } = useThemeStore();
  const homeRows = parseFormation(homeFormation);
  const awayRows = parseFormation(awayFormation);
  const homeLayout = layoutPlayers(homeRows, 'home');
  const awayLayout = layoutPlayers(awayRows, 'away');

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: PITCH_W, height: PITCH_H, position: 'relative' }}>
        <PitchSVG theme={theme} />
        {homeLayout.map((pos, i) => {
          const player = homePlayers[i];
          if (!player) return null;
          return (
            <PlayerMarker
              key={'h' + i}
              x={pos.x * PITCH_W}
              y={pos.y * PITCH_H}
              player={{ ...player, isGK: pos.isGK }}
              color={homeColor}
              delay={i * 50}
              onPress={() => onPlayerPress?.(player, 'home')}
            />
          );
        })}
        {awayLayout.map((pos, i) => {
          const player = awayPlayers[i];
          if (!player) return null;
          return (
            <PlayerMarker
              key={'a' + i}
              x={pos.x * PITCH_W}
              y={pos.y * PITCH_H}
              player={{ ...player, isGK: pos.isGK }}
              color={awayColor}
              delay={i * 50 + 200}
              onPress={() => onPlayerPress?.(player, 'away')}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  markerWrap: { position: 'absolute', width: 48, alignItems: 'center' },
  marker: {
    width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  markerNum: { color: '#fff', fontWeight: '700', fontSize: 13 },
  markerName: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 2, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 2 },
});
