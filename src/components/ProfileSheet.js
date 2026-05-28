import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Modal, Animated, Dimensions, Switch, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

const { height } = Dimensions.get('window');

const PROVIDER_META = {
  google:    { label: 'Google',    color: '#EA4335', icon: 'G', textColor: '#FFF' },
  facebook:  { label: 'Facebook',  color: '#1877F2', icon: 'f', textColor: '#FFF' },
  instagram: { label: 'Instagram', color: '#E1306C', icon: '📸', textColor: '#FFF' },
  email:     { label: 'Email',     color: '#2DB555', icon: '✉️', textColor: '#FFF' },
};

export default function ProfileSheet({ visible, onClose }) {
  const { user, logout } = useAuthStore();
  const { theme, isDark, toggle: toggleTheme } = useThemeStore();

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 11 }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: height, duration: 260, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0,      duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!user) return null;

  const provider = PROVIDER_META[user.provider] || PROVIDER_META.email;
  const initials = (user.displayName || 'U').slice(0, 2).toUpperCase();

  const confirmLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out', style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            onClose();
            await logout();
          },
        },
      ],
    );
  };

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient
          colors={isDark ? ['rgba(14,22,14,1)', 'rgba(8,12,8,1)'] : ['rgba(255,255,255,1)', 'rgba(245,250,245,1)']}
          style={styles.sheetInner}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {/* ── User Card ──────────────────────────────────────────────────── */}
          <LinearGradient
            colors={isDark ? ['rgba(45,181,85,0.12)', 'rgba(45,181,85,0.04)'] : ['rgba(26,122,60,0.1)', 'rgba(26,122,60,0.04)']}
            style={[styles.userCard, { borderColor: theme.border }]}
          >
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              {user.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
              ) : (
                <LinearGradient colors={[provider.color, provider.color + 'BB']} style={styles.avatarImg}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </LinearGradient>
              )}
              {/* Provider badge */}
              <View style={[styles.provBadge, { backgroundColor: provider.color }]}>
                <Text style={styles.provBadgeText}>{provider.icon}</Text>
              </View>
            </View>

            {/* Info */}
            <View style={styles.userInfo}>
              <Text style={[styles.displayName, { color: theme.textPrimary }]} numberOfLines={1}>
                {user.displayName}
              </Text>
              {user.email && (
                <Text style={[styles.userEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                  {user.email}
                </Text>
              )}
              {/* Provider pill */}
              <View style={[styles.provPill, { backgroundColor: provider.color + '22', borderColor: provider.color + '55' }]}>
                <Text style={[styles.provPillText, { color: provider.color }]}>
                  {provider.icon}  {provider.label}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* ── Menu Items ─────────────────────────────────────────────────── */}

          {/* Dark / Light theme */}
          <View style={[styles.menuRow, { borderColor: theme.border }]}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIcon, { backgroundColor: isDark ? '#1A2A1A' : '#E8F5EC' }]}>
                <Text style={{ fontSize: 16 }}>{isDark ? '🌙' : '☀️'}</Text>
              </View>
              <View>
                <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Text style={[styles.menuSub, { color: theme.textMuted }]}>Tap to switch</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#E0E0D8', true: '#2DB55555' }}
              thumbColor={isDark ? '#2DB555' : '#9E9E9E'}
            />
          </View>

          {/* Notifications (placeholder) */}
          <View style={[styles.menuRow, { borderColor: theme.border }]}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIcon, { backgroundColor: isDark ? '#1A1A2A' : '#E8EEF5' }]}>
                <Text style={{ fontSize: 16 }}>🔔</Text>
              </View>
              <View>
                <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>Match Alerts</Text>
                <Text style={[styles.menuSub, { color: theme.textMuted }]}>Goals, cards & results</Text>
              </View>
            </View>
            <Switch
              value={true}
              trackColor={{ false: '#E0E0D8', true: '#2DB55555' }}
              thumbColor="#2DB555"
            />
          </View>

          {/* My Profile */}
          <TouchableOpacity style={[styles.menuRow, { borderColor: theme.border }]} activeOpacity={0.7} onPress={onClose}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIcon, { backgroundColor: isDark ? '#2A1A10' : '#FEF5E8' }]}>
                <Text style={{ fontSize: 16 }}>👤</Text>
              </View>
              <View>
                <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>My Profile</Text>
                <Text style={[styles.menuSub, { color: theme.textMuted }]}>Edit display name & photo</Text>
              </View>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 16 }}>›</Text>
          </TouchableOpacity>

          {/* About */}
          <TouchableOpacity style={[styles.menuRow, { borderColor: theme.border }]} activeOpacity={0.7} onPress={onClose}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIcon, { backgroundColor: isDark ? '#10201A' : '#E8F5F0' }]}>
                <Text style={{ fontSize: 16 }}>ℹ️</Text>
              </View>
              <View>
                <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>About FIFA Rapid</Text>
                <Text style={[styles.menuSub, { color: theme.textMuted }]}>Version 1.0.0 • 2026</Text>
              </View>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 16 }}>›</Text>
          </TouchableOpacity>

          {/* Sign Out */}
          <TouchableOpacity
            style={[styles.signOutBtn, { borderColor: '#FF555533', backgroundColor: '#FF555511' }]}
            onPress={confirmLogout}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18 }}>🚪</Text>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', elevation: 30, shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 30 },
  sheetInner: { paddingHorizontal: 20, paddingBottom: 48 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 20 },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  provBadge: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  provBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  userInfo: { flex: 1 },
  displayName: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  userEmail: { fontSize: 13, marginBottom: 8 },
  provPill: { flexDirection: 'row', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  provPillText: { fontSize: 12, fontWeight: '700' },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  menuIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '700' },
  menuSub: { fontSize: 12, marginTop: 1 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5 },
  signOutText: { color: '#FF5555', fontSize: 16, fontWeight: '800' },
});
