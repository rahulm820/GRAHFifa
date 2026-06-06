// ─────────────────────────────────────────────────────────────────────────────
// HorizontalTabBar.js — Pill-style tab bar: Completed | Live | Upcoming
// Shows pulsing red dot on Live tab when matches exist
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useThemeStore } from '../store/themeStore';

const TABS = [
  { key: 'FINISHED',  label: 'Completed' },
  { key: 'LIVE',      label: 'Live' },
  { key: 'SCHEDULED', label: 'Upcoming' },
];

function PulseDot() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.pulseDot, { opacity: anim }]} />
  );
}

export default function HorizontalTabBar({ activeTab, onTabChange, hasLive = false }) {
  const { theme } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              isActive && { backgroundColor: theme.primary },
            ]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              { color: isActive ? '#FFFFFF' : theme.textSecondary },
            ]}>
              {tab.label}
            </Text>
            {tab.key === 'LIVE' && hasLive && !isActive && <PulseDot />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderBottomWidth: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e84040',
  },
});
