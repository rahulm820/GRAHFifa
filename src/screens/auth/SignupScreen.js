import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Animated, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '../../config/firebase';
import UsernameModal from './UsernameModal';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_READY = GOOGLE_WEB_CLIENT_ID !== 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com';

const strengthMap = [
  { label: '', color: 'transparent' },
  { label: 'Weak', color: '#FF5555' },
  { label: 'Fair', color: '#FF8C42' },
  { label: 'Good', color: '#F5D264' },
  { label: 'Strong', color: '#2DB555' },
];

function getStrength(pwd) {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return strengthMap[s] || strengthMap[0];
}

export default function SignupScreen({ navigation }) {
  const { theme, isDark } = useThemeStore();
  const {
    signUpWithEmail, prepareGoogleSignIn, error, clearError,
    usernameModalVisible, usernameModalProvider, usernameSuggestion, dismissUsernameModal,
  } = useAuthStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const strength = getStrength(password);

  // ── Fixed redirect URI (no useProxy) ────────────────────────────────────────
  const redirectUri = makeRedirectUri({
    scheme: 'com.anonymous.fifarapidagent2026',
  });

  const [, googleResponse, googlePrompt] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    redirectUri: makeRedirectUri({ useProxy: true }),
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      setLoadingGoogle(false);
      // Two-step: open UsernameModal instead of signing in immediately
      prepareGoogleSignIn(id_token);
    } else if (googleResponse?.type === 'error' || googleResponse?.type === 'dismiss') {
      setLoadingGoogle(false);
    }
  }, [googleResponse]);

  useEffect(() => {
    if (error) Alert.alert('Sign-Up Error', error, [{ text: 'OK', onPress: clearError }]);
  }, [error]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      shake(); Alert.alert('Missing Fields', 'Please fill all fields.'); return;
    }
    if (password !== confirmPwd) { shake(); Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    if (!agreed) { Alert.alert('Terms', 'Please agree to the terms.'); return; }
    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, username.trim());
    } catch { shake(); }
    finally { setLoading(false); }
  };

  const anyLoading = loading || loadingGoogle;

  const FocusedInput = ({ icon, placeholder, value, onChange, secure, toggle, onToggle, keyboard, cap }) => {
    const [foc, setFoc] = useState(false);
    return (
      <View style={[styles.inputWrap, { borderColor: foc ? theme.primary : theme.border, backgroundColor: theme.background }]}>
        <Text style={styles.icon}>{icon}</Text>
        <TextInput
          style={[styles.input, { color: theme.textPrimary }]}
          placeholder={placeholder} placeholderTextColor={theme.textMuted}
          value={value} onChangeText={onChange}
          secureTextEntry={secure} keyboardType={keyboard || 'default'} autoCapitalize={cap || 'sentences'}
          onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        />
        {toggle !== undefined && (
          <TouchableOpacity onPress={onToggle}>
            <Text style={styles.icon}>{secure ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <LinearGradient
          colors={isDark ? ['#030A03', '#0A1A0A', '#0D200D'] : ['#0D3B1E', '#1A6B3C', '#2DB555']}
          style={styles.gradient}
          start={{ x: 0.5, y: 0 }} end={{ x: 0, y: 1 }}
        >
          <View style={styles.dekorWrap} pointerEvents="none">
            <Text style={{ fontSize: 220, opacity: 0.06 }}>🏆</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.ball}>⚽</Text>
              <Text style={styles.appName}>Join FIFA 2026</Text>
              <Text style={styles.sub}>Create your fan account</Text>
            </View>

            <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
              <LinearGradient
                colors={isDark
                  ? ['rgba(18,26,18,0.96)', 'rgba(8,12,8,0.99)']
                  : ['rgba(255,255,255,0.97)', 'rgba(245,250,245,0.99)']}
                style={styles.cardInner}
              >
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Create Account</Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Your World Cup journey starts here 🌍</Text>

                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Quick signup with</Text>
                <TouchableOpacity
                  style={[styles.googleBtn, { backgroundColor: isDark ? '#1C1C1C' : '#FFF', borderColor: '#EA4335' }]}
                  onPress={() => {
                    if (!GOOGLE_READY) { Alert.alert('Not Configured', 'Add GOOGLE_WEB_CLIENT_ID in firebase.js'); return; }
                    setLoadingGoogle(true);
                    googlePrompt();
                  }}
                  disabled={anyLoading}
                  activeOpacity={0.8}
                >
                  {loadingGoogle
                    ? <ActivityIndicator color="#EA4335" size="small" />
                    : <Text style={[styles.socialIcon, { color: '#EA4335', fontWeight: '900' }]}>G</Text>}
                  <Text style={[styles.googleLabel, { color: theme.textPrimary }]}>Continue with Google</Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={[styles.divLine, { backgroundColor: theme.border }]} />
                  <Text style={[styles.divText, { color: theme.textMuted }]}>or sign up with email</Text>
                  <View style={[styles.divLine, { backgroundColor: theme.border }]} />
                </View>

                <FocusedInput icon="🎮" placeholder="Choose a username" value={username} onChange={setUsername} cap="none" />
                <FocusedInput icon="✉️" placeholder="Email address" value={email} onChange={setEmail} keyboard="email-address" cap="none" />
                <FocusedInput icon="🔒" placeholder="Create password" value={password} onChange={setPassword} secure={!showPwd} toggle onToggle={() => setShowPwd(!showPwd)} cap="none" />

                {password.length > 0 && (
                  <View style={styles.strengthRow}>
                    <View style={styles.strengthBars}>
                      {[1, 2, 3, 4].map(i => (
                        <View
                          key={i}
                          style={[
                            styles.strengthBar,
                            { backgroundColor: i <= strengthMap.indexOf(strength) ? strength.color : theme.border },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                  </View>
                )}

                <FocusedInput icon="🔑" placeholder="Confirm password" value={confirmPwd} onChange={setConfirmPwd} secure={!showConfirm} toggle onToggle={() => setShowConfirm(!showConfirm)} cap="none" />

                <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
                  <View style={[styles.checkbox, { borderColor: agreed ? theme.primary : theme.border, backgroundColor: agreed ? theme.primary : 'transparent' }]}>
                    {agreed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.termsText, { color: theme.textSecondary }]}>
                    I agree to the <Text style={{ color: theme.primary, fontWeight: '700' }}>Terms</Text> and <Text style={{ color: theme.primary, fontWeight: '700' }}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSignup} disabled={anyLoading} activeOpacity={0.85}>
                  <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.mainBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>Create Account 🚀</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.loginRow}>
                  <Text style={[styles.loginText, { color: theme.textSecondary }]}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={[styles.loginLink, { color: theme.primary }]}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>

            <Text style={styles.footer}>FIFA World Cup 2026 • USA 🇺🇸 MEX 🇲🇽 CAN 🇨🇦</Text>
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
  dekorWrap: { position: 'absolute', top: -10, right: -20 },
  header: { alignItems: 'center', paddingTop: 52, paddingBottom: 24 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' },
  ball: { fontSize: 48, marginBottom: 6 },
  appName: { fontSize: 30, fontWeight: '900', color: '#FFF', letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
  card: { borderRadius: 28, overflow: 'hidden', elevation: 20, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 24 },
  cardInner: { padding: 28 },
  cardTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  cardSub: { fontSize: 14, marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1.5, paddingVertical: 14, gap: 10, marginBottom: 20 },
  socialIcon: { fontSize: 20 },
  googleLabel: { fontSize: 15, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 11, marginHorizontal: 10, fontWeight: '500' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, marginBottom: 12, height: 52 },
  icon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '700', minWidth: 60, textAlign: 'right' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkmark: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  termsText: { flex: 1, fontSize: 13, lineHeight: 20 },
  mainBtn: { borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#1A7A3C', shadowOpacity: 0.5, shadowRadius: 12 },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '800' },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 24, letterSpacing: 0.5 },
});