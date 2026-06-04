import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import UsernameModal from './UsernameModal';

// expo-auth-session imports — only used on native, safe to import on web too
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '../../config/firebase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { theme, isDark } = useThemeStore();
  const {
    loginWithEmail,
    loginWithGooglePopup,   // Firebase signInWithPopup — used on web
    prepareGoogleSignIn,    // expo-auth-session flow — used on native
    error, clearError,
    usernameModalVisible, usernameModalProvider, usernameSuggestion, dismissUsernameModal,
  } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  // ── expo-auth-session hook — always called (hooks must not be conditional) ──
  // On web this hook still runs but googlePrompt() is never called.
  const [, googleResponse, googlePrompt] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    redirectUri: makeRedirectUri(),   // auto-detects: proxy on Expo Go, scheme on standalone
  });

  // Handle native Google response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken
        ?? googleResponse.params?.id_token;
      if (idToken) prepareGoogleSignIn(idToken);
      setLoadingGoogle(false);
    } else if (googleResponse?.type === 'error' || googleResponse?.type === 'dismiss') {
      setLoadingGoogle(false);
    }
  }, [googleResponse]);

  useEffect(() => {
    if (error) {
      Alert.alert('Sign-In Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) { shake(); return; }
    setLoadingEmail(true);
    try {
      await loginWithEmail(email.trim(), password);
    } catch {
      shake();
    } finally {
      setLoadingEmail(false);
    }
  };

  // ── Platform-aware Google Sign-In ────────────────────────────────────────────
  // WEB  → Firebase signInWithPopup (no redirect URI config needed — ever)
  // NATIVE → expo-auth-session prompt
  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      if (Platform.OS === 'web') {
        await loginWithGooglePopup();
        // loginWithGooglePopup resolves after sign-in; onAuthStateChanged updates state
      } else {
        googlePrompt();  // response handled by the useEffect above
      }
    } catch (e) {
      setLoadingGoogle(false);
      Alert.alert('Google Sign-In Failed', e.message);
    }
  };

  const anyLoading = loadingEmail || loadingGoogle;

  return (
    <>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <LinearGradient
          colors={isDark ? ['#030A03', '#0A1A0A', '#0D200D'] : ['#0D3B1E', '#1A6B3C', '#2DB555']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={styles.dekorWrap} pointerEvents="none">
            <Text style={styles.dekorStadium}>🏟️</Text>
            <View style={styles.ring1} /><View style={styles.ring2} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.ball}>⚽</Text>
              <Text style={styles.appName}>FIFA 2026</Text>
              <Text style={styles.tagline}>RAPID AGENT</Text>
              <Text style={styles.sub}>The World Cup in your pocket</Text>
            </View>

            <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
              <LinearGradient
                colors={isDark
                  ? ['rgba(18,26,18,0.96)', 'rgba(8,12,8,0.99)']
                  : ['rgba(255,255,255,0.97)', 'rgba(245,250,245,0.99)']}
                style={styles.cardInner}
              >
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Welcome Back</Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Sign in to continue</Text>

                <View style={[styles.inputWrap, { borderColor: emailFocused ? theme.primary : theme.border, backgroundColor: theme.background }]}>
                  <Text style={styles.icon}>✉️</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
                    placeholder="Email address" placeholderTextColor={theme.textMuted}
                    value={email} onChangeText={setEmail}
                    keyboardType="email-address" autoCapitalize="none"
                    onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)}
                  />
                </View>

                <View style={[styles.inputWrap, { borderColor: passFocused ? theme.primary : theme.border, backgroundColor: theme.background }]}>
                  <Text style={styles.icon}>🔒</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
                    placeholder="Password" placeholderTextColor={theme.textMuted}
                    value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
                    onFocus={() => setPassFocused(true)} onBlur={() => setPassFocused(false)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.icon}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotBtn}>
                  <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot password?</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleEmailLogin} disabled={anyLoading} activeOpacity={0.85}>
                  <LinearGradient
                    colors={[theme.primary, theme.primaryDark]}
                    style={styles.mainBtn}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    {loadingEmail
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.mainBtnText}>Sign In</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={[styles.divLine, { backgroundColor: theme.border }]} />
                  <Text style={[styles.divText, { color: theme.textMuted }]}>or continue with</Text>
                  <View style={[styles.divLine, { backgroundColor: theme.border }]} />
                </View>

                <TouchableOpacity
                  style={[styles.googleBtn, { backgroundColor: isDark ? '#1C1C1C' : '#FFF', borderColor: '#EA4335' }]}
                  onPress={handleGoogle} disabled={anyLoading} activeOpacity={0.8}
                >
                  {loadingGoogle
                    ? <ActivityIndicator color="#EA4335" size="small" />
                    : <Text style={[styles.socialIcon, { color: '#EA4335', fontWeight: '900' }]}>G</Text>}
                  <Text style={[styles.googleLabel, { color: theme.textPrimary }]}>Continue with Google</Text>
                </TouchableOpacity>

                <View style={styles.signupRow}>
                  <Text style={[styles.signupText, { color: theme.textSecondary }]}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                    <Text style={[styles.signupLink, { color: theme.primary }]}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>

            <Text style={styles.footer}>FIFA World Cup 2026</Text>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>

      <UsernameModal
        visible={usernameModalVisible}
        provider={usernameModalProvider}
        suggestion={usernameSuggestion}
        onDismiss={dismissUsernameModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
  dekorWrap: { position: 'absolute', top: -20, right: -30, opacity: 0.06 },
  dekorStadium: { fontSize: 240 },
  ring1: { position: 'absolute', top: 40, left: -80, width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: '#2DB555' },
  ring2: { position: 'absolute', top: 100, left: -120, width: 300, height: 300, borderRadius: 150, borderWidth: 1, borderColor: '#F5D264' },
  header: { alignItems: 'center', paddingTop: 64, paddingBottom: 28 },
  ball: { fontSize: 56, marginBottom: 8 },
  appName: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },
  tagline: { fontSize: 13, fontWeight: '800', color: '#F5D264', letterSpacing: 5, textTransform: 'uppercase', marginTop: 2 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  card: { borderRadius: 28, overflow: 'hidden', elevation: 20, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 24 },
  cardInner: { padding: 28 },
  cardTitle: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  cardSub: { fontSize: 14, marginBottom: 24 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, marginBottom: 14, height: 52 },
  icon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { fontSize: 13, fontWeight: '600' },
  mainBtn: { borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#1A7A3C', shadowOpacity: 0.5, shadowRadius: 12 },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 12, marginHorizontal: 12, fontWeight: '500' },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1.5, paddingVertical: 14, gap: 10, marginBottom: 20 },
  socialIcon: { fontSize: 20 },
  googleLabel: { fontSize: 15, fontWeight: '700' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupText: { fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: '800' },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 24, letterSpacing: 0.5 },
});