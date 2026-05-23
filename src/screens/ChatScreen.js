import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '../components/ScreenHeader';
import { useThemeStore } from '../store/themeStore';
import { useChatStore } from '../store/chatStore';
import { useMatchStore } from '../store/matchStore';

export default function ChatScreen() {
  const { theme } = useThemeStore();
  const { messages, summary, send } = useChatStore();
  const { match } = useMatchStore();
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(true);

  const onSend = () => { if (text.trim()) { send(text.trim()); setText(''); } };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="Match Room" subtitle={`1.2k watching · ${match.home.code} ${match.home.score}-${match.away.score} ${match.away.code}`} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={80}>
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
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
          renderItem={({ item }) => <Message msg={item} theme={theme} />}
        />

        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity><Icon name="image-outline" size={24} color={theme.textSecondary} /></TouchableOpacity>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Join the discussion..."
            placeholderTextColor={theme.textMuted}
            style={{ flex: 1, color: theme.textPrimary, marginHorizontal: 10, paddingVertical: 8 }}
          />
          <TouchableOpacity onPress={onSend} style={[styles.sendBtn, { backgroundColor: theme.primary }]}>
            <Icon name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const Message = ({ msg, theme }) => {
  if (msg.system) {
    return (
      <View style={{ alignSelf: 'center', marginVertical: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: theme.accent + '33' }}>
        <Text style={{ color: theme.accent, fontWeight: '600', fontSize: 12 }}>{msg.text}</Text>
      </View>
    );
  }
  const isMine = msg.mine;
  const initials = msg.user.slice(0, 2).toUpperCase();
  return (
    <View style={{ flexDirection: isMine ? 'row-reverse' : 'row', marginVertical: 6, alignItems: 'flex-end' }}>
      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{initials}</Text>
      </View>
      <View style={{ maxWidth: '75%', marginHorizontal: 8 }}>
        {!isMine && <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 2 }}>{msg.user} {msg.flag || ''}</Text>}
        <View style={[styles.bubble, { backgroundColor: isMine ? theme.primary : theme.surface }]}>
          <Text style={{ color: isMine ? '#fff' : theme.textPrimary }}>{msg.text}</Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 4, gap: 4 }}>
          {Object.entries(msg.reactions || {}).map(([emoji, count]) => (
            <View key={emoji} style={[styles.reaction, { backgroundColor: theme.surfaceElevated }]}>
              <Text style={{ fontSize: 11 }}>{emoji} {count}</Text>
            </View>
          ))}
          <Text style={{ color: theme.textMuted, fontSize: 10, marginLeft: 4 }}>{msg.time}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summary: { padding: 14, borderRadius: 10, borderLeftWidth: 3, marginBottom: 12 },
  avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  reaction: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, paddingBottom: 24 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});
