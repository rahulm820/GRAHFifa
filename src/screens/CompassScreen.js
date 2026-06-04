import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView, Platform,
  Animated, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '../components/ScreenHeader';
import { useThemeStore } from '../store/themeStore';
import { compassCategories, compassSuggestions } from '../data/mockData';

// ─── Claude API helper ────────────────────────────────────────────────────────
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are FIFA Rapid Agent's AI Compass — a sharp, friendly local guide for FIFA World Cup 2026 fans. You help fans find hospitals, hotels, restaurants, transport, pharmacies, fan zones, and anything else they need around the stadium.

Your personality: warm, fast, practical. You speak like a knowledgeable local friend who's excited about the World Cup.

Rules:
- Keep responses SHORT and scannable (max 3–4 sentences or a tight list).
- Always end with a location card JSON block when recommending a specific place. Format it EXACTLY like this (at the very end of your message, no extra text after it):
  <<<CARD>>>{"name":"Place Name","category":"Hospital","distance":"1.2km","rating":4.5,"address":"Street, City","action":"Get Directions","tip":"Brief insider tip"}<<<END>>>
- If the user asks for multiple places, include multiple cards (one per place, each on its own <<<CARD>>>...<<<END>>> block).
- If no specific place is relevant (general questions, directions advice, etc.), omit the card.
- Use relevant emojis sparingly.
- The current match is Brazil 🇧🇷 vs Argentina 🇦🇷 at Estádio Maracanã, Rio de Janeiro. Use this as location context.
- NEVER make up real phone numbers or real URLs.`;

async function askClaude(messages) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || '';
}

// Parse <<<CARD>>>...<<<END>>> blocks out of a message
function parseCards(text) {
  const cards = [];
  const regex = /<<<CARD>>>([\s\S]*?)<<<END>>>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try { cards.push(JSON.parse(match[1].trim())); } catch { }
  }
  const cleanText = text.replace(/<<<CARD>>>[\s\S]*?<<<END>>>/g, '').trim();
  return { cleanText, cards };
}

// ─── Category icon map ────────────────────────────────────────────────────────
const CATEGORY_PROMPTS = {
  Hospitals: 'Find the nearest hospital or emergency medical centre to Maracanã stadium.',
  Hotels: 'Recommend 2 good hotels near Maracanã stadium for football fans.',
  Restaurants: 'Recommend a great restaurant near Maracanã stadium — local Brazilian food preferred.',
  Transport: 'What are the best transport options to get to and from Maracanã stadium?',
  Stadium: 'Give me key info about Estádio Maracanã — gates, facilities, fan zones.',
  Pharmacy: 'Find the nearest pharmacy to Maracanã stadium.',
};

// ─── Components ───────────────────────────────────────────────────────────────
function LocationCard({ card, theme }) {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: Platform.OS !== 'web', tension: 80, friction: 10 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, []);

  const categoryIcons = {
    Hospital: '🏥', Hotel: '🏨', Restaurant: '🍽️',
    Pharmacy: '💊', Transport: '🚌', Stadium: '🏟️', Default: '📍',
  };
  const icon = categoryIcons[card.category] || categoryIcons.Default;

  return (
    <Animated.View style={[
      styles.card,
      { backgroundColor: theme.surfaceElevated, borderColor: theme.primary + '44', opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: theme.primary + '22' }]}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardName, { color: theme.textPrimary }]}>{card.name}</Text>
          {card.address ? (
            <Text style={[styles.cardAddress, { color: theme.textMuted }]} numberOfLines={1}>{card.address}</Text>
          ) : null}
        </View>
        {card.rating ? (
          <View style={[styles.ratingBadge, { backgroundColor: theme.accent + '22' }]}>
            <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 12 }}>★ {card.rating}</Text>
          </View>
        ) : null}
      </View>
      {card.tip ? (
        <Text style={[styles.cardTip, { color: theme.textSecondary }]}>💡 {card.tip}</Text>
      ) : null}
      <View style={styles.cardFooter}>
        {card.distance ? (
          <View style={[styles.distancePill, { backgroundColor: theme.surface }]}>
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>📍 {card.distance}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
            {card.action || 'Get Directions'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function TypingIndicator({ theme }) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = (dot, delay) => Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: Platform.OS !== 'web' }),
        Animated.delay(600),
      ])
    );
    const a1 = anim(dot1, 0); const a2 = anim(dot2, 200); const a3 = anim(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12 }}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View key={i} style={[styles.typingDot, { backgroundColor: theme.primary, opacity: d }]} />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CompassScreen() {
  const { theme } = useThemeStore();
  const [messages, setMessages] = useState([]); // { id, role, text, cards, isTyping }
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef(null);
  // Keep Claude conversation history (role: user/assistant)
  const historyRef = useRef([]);

  const scrollToEnd = () => setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

  const ask = async (question) => {
    if (loading) return;
    const q = question.trim();
    if (!q) return;

    // Add user message
    const userMsg = { id: `u${Date.now()}`, role: 'user', text: q };
    setMessages(m => [...m, userMsg]);
    setText('');
    scrollToEnd();

    // Add typing indicator
    const typingId = `t${Date.now()}`;
    setMessages(m => [...m, { id: typingId, role: 'typing' }]);
    setLoading(true);
    scrollToEnd();

    // Update history
    historyRef.current = [...historyRef.current, { role: 'user', content: q }];

    try {
      const rawReply = await askClaude(historyRef.current);
      const { cleanText, cards } = parseCards(rawReply);

      // Update history with assistant reply
      historyRef.current = [...historyRef.current, { role: 'assistant', content: rawReply }];

      setMessages(m => {
        const withoutTyping = m.filter(msg => msg.id !== typingId);
        return [...withoutTyping, { id: `a${Date.now()}`, role: 'assistant', text: cleanText, cards }];
      });
    } catch (err) {
      setMessages(m => {
        const withoutTyping = m.filter(msg => msg.id !== typingId);
        return [...withoutTyping, {
          id: `err${Date.now()}`, role: 'assistant',
          text: "Sorry, I couldn't connect right now. Try again in a moment! 🙏",
          cards: [],
        }];
      });
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  };

  const renderItem = ({ item }) => {
    if (item.role === 'typing') {
      return (
        <View style={{ flexDirection: 'row', marginVertical: 4 }}>
          <View style={[styles.botAvatar, { backgroundColor: theme.primary }]}>
            <Text>⚽</Text>
          </View>
          <View style={[styles.typingBubble, { backgroundColor: theme.surface }]}>
            <TypingIndicator theme={theme} />
          </View>
        </View>
      );
    }
    const isMine = item.role === 'user';
    return (
      <View style={{ marginVertical: 4 }}>
        <View style={{ flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
          {!isMine && (
            <View style={[styles.botAvatar, { backgroundColor: theme.primary }]}>
              <Text>⚽</Text>
            </View>
          )}
          <View style={[
            styles.bubble,
            isMine
              ? { backgroundColor: theme.primary, marginRight: 8 }
              : { backgroundColor: theme.surface, marginLeft: 8 },
          ]}>
            <Text style={{ color: isMine ? '#fff' : theme.textPrimary, fontSize: 14, lineHeight: 20 }}>
              {item.text}
            </Text>
          </View>
        </View>
        {/* Location cards below bot messages */}
        {!isMine && item.cards?.length > 0 && (
          <View style={{ marginLeft: 44, marginTop: 8, gap: 8 }}>
            {item.cards.map((card, i) => (
              <LocationCard key={i} card={card} theme={theme} />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="AI Compass" subtitle="Powered by Claude · Local guide 24/7" />

      {/* Category quick-access bar */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 60, flexGrow: 0 }}
        contentContainerStyle={{ padding: 10, gap: 8 }}
      >
        {compassCategories.map(c => (
          <TouchableOpacity
            key={c.label}
            onPress={() => ask(CATEGORY_PROMPTS[c.label] || `Tell me about ${c.label} near the stadium.`)}
            style={[styles.catChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Text style={{ fontSize: 16 }}>{c.icon}</Text>
            <Text style={{ color: theme.textPrimary, marginLeft: 6, fontWeight: '600', fontSize: 12 }}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={80}
      >
        {messages.length === 0 ? (
          /* Empty state — suggestion chips */
          <ScrollView contentContainerStyle={styles.emptyState} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🧭</Text>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Your Local Guide</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Ask me anything — restaurants, transport, hospitals, fan zones…
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20, justifyContent: 'center' }}>
              {compassSuggestions.map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => ask(s)}
                  style={[styles.suggestion, { backgroundColor: theme.surface, borderColor: theme.primary + '66' }]}
                >
                  <Text style={{ color: theme.textPrimary, fontSize: 13 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
            renderItem={renderItem}
            onContentSizeChange={scrollToEnd}
          />
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity style={{ padding: 4 }}>
            <Icon name="mic-outline" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Ask anything about the area…"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.background, borderColor: theme.border }]}
            onSubmitEditing={() => ask(text)}
            returnKeyType="send"
            multiline={false}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => ask(text)}
            disabled={!text.trim() || loading}
            style={[styles.sendBtn, { backgroundColor: text.trim() && !loading ? theme.primary : theme.border }]}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name="arrow-up" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  catChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 18, borderWidth: 1,
  },
  emptyState: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, paddingVertical: 32,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  suggestion: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 14, borderWidth: 1,
  },
  botAvatar: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '78%', padding: 12, borderRadius: 16,
  },
  typingBubble: {
    borderRadius: 16, marginLeft: 8,
  },
  typingDot: {
    width: 7, height: 7, borderRadius: 3.5,
  },
  card: {
    borderRadius: 14, borderWidth: 1,
    padding: 14, gap: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardName: { fontSize: 15, fontWeight: '700' },
  cardAddress: { fontSize: 11, marginTop: 2 },
  cardTip: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  distancePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    paddingBottom: 28, borderTopWidth: 1, gap: 8,
  },
  input: {
    flex: 1, height: 40, borderRadius: 20,
    paddingHorizontal: 14, fontSize: 14,
    borderWidth: 1,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
});