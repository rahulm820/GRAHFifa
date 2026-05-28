import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

const { height } = Dimensions.get('window');

const PROVIDER_CONFIG = {
  google: {
    label: 'Google',
    color: '#EA4335',
    bg: '#FEE8E7',
    darkBg: '#2A1010',
    icon: '🔴',
    brandIcon: 'G',
    message: 'Getting your Google profile...',
  },
  facebook: {
    label: 'Facebook',
    color: '#1877F2',
    bg: '#E7F0FE',
    darkBg: '#101828',
    icon: '🔵',
    brandIcon: 'f',
    message: 'Fetching your Facebook profile...',
  },
  instagram: {
    label: 'Instagram',
    color: '#E1306C',
    bg: '#FDE8F0',
    darkBg: '#2A1018',
    icon: '📸',
    brandIcon: '📷',
    message: 'Connecting to Instagram...',
  },
  email: {
    label: 'Email',
    color: '#2DB555',
    bg: '#E8F5EC',
    darkBg: '#101A12',
    icon: '✉️',
    brandIcon: '✉️',
    message: 'Setting up your account...',
  },
};

export default function UsernameModal({ visible, provider, suggestion, onDismiss }) {
  const { theme, isDark } = useThemeStore();
  const { loginWithProvider } = useAuthStore();

  const [step, setStep] = useState('loading'); // 'loading' | 'username'
  const [username, setUsername] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const cfg = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.email;

  useEffect(() => {
    if (visible) {
      setStep('loading');
      setUsername(suggestion || 'FIFAFan');
      setConfirming(false);

      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      // Pulse animation for loading
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();

      // Simulate OAuth loading → username step
      const timer = setTimeout(() => {
        pulse.stop();
        setStep('username');
      }, 1800);

      return () => { clearTimeout(timer); pulse.stop(); };
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, suggestion]);

  const handleConfirm = async () => {
    if (!username.trim()) return;
    setConfirming(true);
    await loginWithProvider(provider, username.trim());
    // Auth store will update isLoggedIn → App.js will switch navigator
  };

  const handleClose = () => {
    if (confirming) return;
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  if (!visible && slideAnim._value >= height) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient
            colors={isDark
              ? ['rgba(18,26,18,0.99)', 'rgba(10,15,10,1)']
              : ['rgba(255,255,255,1)', 'rgba(245,250,245,1)']}
            style={styles.sheetInner}
          >
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: theme.border }]} />

            {/* Provider badge */}
            <View style={[styles.providerBadge, { backgroundColor: isDark ? cfg.darkBg : cfg.bg, borderColor: cfg.color + '40' }]}>
              <Text style={[styles.providerBrandIcon, { color: cfg.color, fontWeight: '900', fontSize: 22 }]}>
                {cfg.brandIcon}
              </Text>
              <Text style={[styles.providerLabel, { color: cfg.color }]}>{cfg.label}</Text>
            </View>

            {step === 'loading' ? (
              /* Loading State */
              <View style={styles.loadingContent}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <LinearGradient
                    colors={[cfg.color + 'AA', cfg.color]}
                    style={styles.loadingOrb}
                  >
                    <Text style={styles.loadingOrbIcon}>⚽</Text>
                  </LinearGradient>
                </Animated.View>
                <Text style={[styles.loadingTitle, { color: theme.textPrimary }]}>
                  {cfg.message}
                </Text>
                <ActivityIndicator color={cfg.color} style={{ marginTop: 12 }} />
                <View style={styles.loadingDots}>
                  {[0, 1, 2].map(i => (
                    <View key={i} style={[styles.dot, { backgroundColor: cfg.color, opacity: 0.4 + i * 0.3 }]} />
                  ))}
                </View>
              </View>
            ) : (
              /* Username Step */
              <View style={styles.usernameContent}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Almost there! 🎉
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Choose your FIFA fan username. You can change this anytime.
                </Text>

                {/* Username Input */}
                <View style={[
                  styles.usernameInputWrap,
                  { borderColor: inputFocused ? cfg.color : theme.border, backgroundColor: theme.background },
                ]}>
                  <Text style={styles.atSign}>@</Text>
                  <TextInput
                    style={[styles.usernameInput, { color: theme.textPrimary }]}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="your_username"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="none"
                    autoFocus
                    maxLength={30}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                  />
                  {username.length > 0 && (
                    <TouchableOpacity onPress={() => setUsername('')}>
                      <Text style={{ color: theme.textMuted, fontSize: 16 }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={[styles.usernameHint, { color: theme.textMuted }]}>
                  {username.length}/30 characters • Letters, numbers, underscores only
                </Text>

                {/* Confirm Button */}
                <TouchableOpacity
                  onPress={handleConfirm}
                  disabled={confirming || !username.trim()}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[cfg.color, cfg.color + 'CC']}
                    style={[styles.confirmBtn, { opacity: !username.trim() ? 0.5 : 1 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {confirming
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.confirmBtnText}>Let's Go! ⚽</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
                  <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, elevation: 30,
  },
  sheetInner: { paddingHorizontal: 24, paddingBottom: 48 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  providerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, marginBottom: 24,
  },
  providerBrandIcon: {},
  providerLabel: { fontSize: 14, fontWeight: '700' },
  loadingContent: { alignItems: 'center', paddingVertical: 20 },
  loadingOrb: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
    marginBottom: 20,
  },
  loadingOrbIcon: { fontSize: 36 },
  loadingTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  loadingDots: { flexDirection: 'row', gap: 6, marginTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  usernameContent: { paddingTop: 4 },
  modalTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  usernameInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderRadius: 16,
    paddingHorizontal: 16, height: 58, marginBottom: 8,
  },
  atSign: { fontSize: 18, fontWeight: '900', color: '#2DB555', marginRight: 4 },
  usernameInput: { flex: 1, fontSize: 18, fontWeight: '700' },
  usernameHint: { fontSize: 12, marginBottom: 24, textAlign: 'center' },
  confirmBtn: {
    borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    marginBottom: 12,
  },
  confirmBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
