import React, { useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

// Provider badge colors
const PROVIDER_COLORS = {
  google: '#EA4335',
  facebook: '#1877F2',
  instagram: '#E1306C',
  email: '#2DB555',
};

const PROVIDER_ICONS = {
  google: 'G',
  facebook: 'f',
  instagram: '📸',
  email: '✉️',
};

export default function UserAvatar({ size = 36, onPress, showOnlineDot = true }) {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  if (!user) return null;

  const providerColor = PROVIDER_COLORS[user.provider] || theme.primary;
  const initials = (user.displayName || 'U').slice(0, 2).toUpperCase();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, tension: 200 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.container}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {/* Avatar circle */}
        <View style={[
          styles.avatarRing,
          { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2, borderColor: providerColor + 'AA' },
        ]}>
          {user.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={{ width: size, height: size, borderRadius: size / 2 }}
            />
          ) : (
            <View style={[styles.initialsCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: providerColor }]}>
              <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
            </View>
          )}
        </View>

        {/* Provider badge */}
        <View style={[styles.providerBadge, { backgroundColor: providerColor, bottom: -2, right: -2 }]}>
          <Text style={styles.providerIcon}>{PROVIDER_ICONS[user.provider] || '✉️'}</Text>
        </View>

        {/* Online dot */}
        {showOnlineDot && (
          <View style={[styles.onlineDot, { borderColor: '#0A0F0A', top: -1, left: -1 }]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  avatarRing: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  initialsCircle: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFF', fontWeight: '900' },
  providerBadge: {
    position: 'absolute',
    width: 14, height: 14, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFF',
  },
  providerIcon: { fontSize: 7, fontWeight: '900', color: '#FFF' },
  onlineDot: {
    position: 'absolute',
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
  },
});
