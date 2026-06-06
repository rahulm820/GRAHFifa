import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList, Modal,
  KeyboardAvoidingView, Platform, Animated, StyleSheet, Dimensions,
  PanResponder, Keyboard,
} from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { useGeminiStore } from '../store/geminiStore';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ theme }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={[styles.typingRow]}>
      <View style={[styles.aiBubble, { backgroundColor: theme.surface }]}>
        <View style={styles.dotsRow}>
          {dots.map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, { backgroundColor: theme.primary, transform: [{ translateY: dot }] }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, theme }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
      {!isUser && (
        <View style={[styles.aiAvatar, { backgroundColor: theme.primary + '22' }]}>
          <Text style={{ fontSize: 14 }}>⚽</Text>
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser
          ? [styles.userBubble, { backgroundColor: theme.primary }]
          : [styles.aiBubble, { backgroundColor: theme.surface }]
      ]}>
        <Text style={[
          styles.bubbleText,
          { color: isUser ? '#FFFFFF' : theme.textPrimary }
        ]}>{msg.text}</Text>
        <Text style={[styles.bubbleTime, { color: isUser ? 'rgba(255,255,255,0.6)' : theme.textMuted }]}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

// ─── FAB sparkle animation ────────────────────────────────────────────────────
function SparkleIcon() {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '15deg'] });

  return (
    <Animated.Text style={[styles.fabIcon, { transform: [{ rotate: spin }] }]}>
      ⚽
    </Animated.Text>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GeminiChatbot() {
  const { theme } = useThemeStore();
  const { messages, isLoading, isOpen, toggleChat, closeChat, sendMessage, clearMessages } = useGeminiStore();
  const [input, setInput] = useState('');
  const flatListRef = useRef(null);
  const pan = useRef(new Animated.ValueXY({ x: SW - 72, y: SH - 200 })).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  // FAB drag
  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 8,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
        Animated.spring(fabScale, { toValue: 0.9, useNativeDriver: true }).start();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        Animated.spring(fabScale, { toValue: 1, useNativeDriver: true }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isLoading]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
    Keyboard.dismiss();
  };

  const quickPrompts = [
    '⚽ Summarize the current match',
    '🏆 Who are the top scorers?',
    '📊 How is Argentina doing?',
    '🕐 What happened in the first half?',
  ];

  if (!isOpen) {
    return (
      <Animated.View
        {...responder.panHandlers}
        style={[
          styles.fab,
          {
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
            transform: [...pan.getTranslateTransform(), { scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity onPress={toggleChat} activeOpacity={0.8} style={styles.fabTouchable}>
          <SparkleIcon />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Modal transparent visible={isOpen} animationType="slide" onRequestClose={closeChat}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalWrap}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeChat} />

        <View style={[styles.chatContainer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.chatHeader, { backgroundColor: theme.primary, borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerIcon}>⚽</Text>
              <View>
                <Text style={styles.headerTitle}>Kick</Text>
                <Text style={styles.headerSubtitle}>Powered by Gemini · ADK</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={clearMessages} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>🗑️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeChat} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={[styles.messageList, messages.length === 0 && styles.emptyList]}
            renderItem={({ item }) => <MessageBubble msg={item} theme={theme} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>⚽</Text>
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                  Hey! I'm Kick
                </Text>
                <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                  Your AI football pundit. Ask me about live scores, player stats, standings, or the tournament!
                </Text>
                <View style={styles.quickPrompts}>
                  {quickPrompts.map((prompt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.quickChip, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '33' }]}
                      onPress={() => sendMessage(prompt)}
                    >
                      <Text style={[styles.quickChipText, { color: theme.primary }]}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            ListFooterComponent={isLoading ? <TypingIndicator theme={theme} /> : null}
          />

          {/* Input */}
          <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <TextInput
              style={[styles.textInput, { color: theme.textPrimary, backgroundColor: theme.background }]}
              placeholder="Ask Kick anything..."
              placeholderTextColor={theme.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
              style={[
                styles.sendBtn,
                { backgroundColor: input.trim() && !isLoading ? theme.primary : theme.border },
              ]}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // FAB
  fab: {
    position: 'absolute', width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', zIndex: 9998,
    shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 10,
  },
  fabTouchable: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  fabIcon: { fontSize: 26 },

  // Modal
  modalWrap: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  chatContainer: {
    height: SH * 0.7,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  // Header
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '500', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  clearBtnText: { fontSize: 16 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Messages
  messageList: { padding: 16, paddingBottom: 8 },
  emptyList: { flex: 1, justifyContent: 'center' },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },

  // Empty state
  emptyState: { alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  quickPrompts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  quickChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  quickChipText: { fontSize: 12, fontWeight: '600' },

  // Typing indicator
  typingRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  dotsRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12,
    paddingVertical: 10, borderTopWidth: 1, gap: 8,
  },
  textInput: {
    flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, maxHeight: 100, minHeight: 40,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
