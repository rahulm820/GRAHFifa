import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '../components/ScreenHeader';
import { useThemeStore } from '../store/themeStore';
import { useChatStore } from '../store/chatStore';
import { useMatchStore } from '../store/matchStore';
import { useAuthStore } from '../store/authStore';

export default function ChatScreen() {
  const { theme } = useThemeStore();
  const { messages, summary, send } = useChatStore();
  const { match } = useMatchStore();
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(true);
  const flatRef = useRef(null);

  const onSend = () => {
    if (!text.trim()) return;
    send(text.trim(), user);
    setText('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader
        title="Match Room"
        subtitle={`1.2k watching · ${match.home.code} ${match.home.score}-${match.away.score} ${match.away.code}`}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={80}>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={[styles.summary, { backgroundColor: theme.surfaceElevated, borderLeftColor: theme.primary }]}>
              <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: theme.textPrimary, fontWeight: '700', flex: 1 }}>🤖 AI Summary</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>Updated 2m ago</Text>
                <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              {expanded && (
                <View style={{ marginTop: 10 }}>
                  {summary.map((s, i) => (
                    <Text key={i} style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>• {s}</Text>
                  ))}
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <Message msg={item} theme={theme} currentUid={user?.uid} currentPhotoURL={user?.photoURL} currentName={user?.displayName} />
          )}
        />

        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          {/* Own mini-avatar in input bar */}
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.inputAvatar} />
          ) : (
            <View style={[styles.inputAvatarFallback, { backgroundColor: theme.primary }]}>
              <Text style={styles.inputAvatarInitials}>{(user?.displayName || 'U').slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Join the discussion..."
            placeholderTextColor={theme.textMuted}
            style={{ flex: 1, color: theme.textPrimary, marginHorizontal: 10, paddingVertical: 8 }}
            onSubmitEditing={onSend}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={onSend} style={[styles.sendBtn, { backgroundColor: text.trim() ? theme.primary : theme.border }]}>
            <Icon name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
const Message = ({ msg, theme, currentUid, currentPhotoURL, currentName }) => {
  if (msg.system) {
    return (
      <View style={{ alignSelf: 'center', marginVertical: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: theme.accent + '33' }}>
        <Text style={{ color: theme.accent, fontWeight: '600', fontSize: 12 }}>{msg.text}</Text>
      </View>
    );
  }

  // Determine if this message is "mine"
  const isMine = msg.mine || (currentUid && msg.uid === currentUid);
  const initials = (msg.user || 'U').slice(0, 2).toUpperCase();

  // For own messages, use real photoURL from auth (in case message was sent before photo loaded)
  const avatarUrl = isMine ? (currentPhotoURL || msg.photoURL) : msg.photoURL;

  const AvatarComp = () => {
    if (avatarUrl) {
      return <Image source={{ uri: avatarUrl }} style={[styles.avatarImg, isMine && styles.avatarImgMine]} />;
    }
    return (
      <View style={[styles.avatarInitialsWrap, { backgroundColor: isMine ? theme.primary : theme.surfaceElevated }]}>
        <Text style={[styles.avatarInitialsText, { color: isMine ? '#FFF' : theme.textPrimary }]}>{initials}</Text>
      </View>
    );
  };

  return (
    <View style={{ flexDirection: isMine ? 'row-reverse' : 'row', marginVertical: 6, alignItems: 'flex-end' }}>
      <AvatarComp />
      <View style={{ maxWidth: '72%', marginHorizontal: 8 }}>
        {!isMine && (
          <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 2 }}>
            {msg.user} {msg.flag || ''}
          </Text>
        )}
        <View style={[
          styles.bubble,
          isMine
            ? { backgroundColor: theme.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: theme.surface, borderBottomLeftRadius: 4 },
        ]}>
          <Text style={{ color: isMine ? '#fff' : theme.textPrimary, fontSize: 14 }}>{msg.text}</Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 4, gap: 4, justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
          {Object.entries(msg.reactions || {}).map(([emoji, count]) => (
            <View key={emoji} style={[styles.reaction, { backgroundColor: theme.surfaceElevated }]}>
              <Text style={{ fontSize: 11 }}>{emoji} {count}</Text>
            </View>
          ))}
          <Text style={{ color: theme.textMuted, fontSize: 10, marginLeft: 4, alignSelf: 'center' }}>{msg.time}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summary: { padding: 14, borderRadius: 10, borderLeftWidth: 3, marginBottom: 12 },
  avatarImg: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  avatarImgMine: { borderColor: '#2DB555' },
  avatarInitialsWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarInitialsText: { fontSize: 11, fontWeight: '700' },
  bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  reaction: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, paddingBottom: 24, gap: 8 },
  inputAvatar: { width: 32, height: 32, borderRadius: 16 },
  inputAvatarFallback: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  inputAvatarInitials: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
