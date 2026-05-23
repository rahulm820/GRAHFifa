import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '../components/ScreenHeader';
import { useThemeStore } from '../store/themeStore';
import { compassCategories, compassSuggestions } from '../data/mockData';

export default function CompassScreen() {
  const { theme } = useThemeStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const ask = (q) => {
    const userMsg = { id: Date.now() + '', mine: true, text: q };
    const botMsg = {
      id: (Date.now() + 1) + '', mine: false,
      text: `Here's what I found for "${q}":`,
      card: { name: 'Hospital São Lucas', distance: '1.2km', rating: 4.6, action: 'Get Directions' },
    };
    setMessages(m => [...m, userMsg, botMsg]);
    setText('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="AI Compass" subtitle="Local guide · 24/7" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 60 }} contentContainerStyle={{ padding: 12, gap: 8 }}>
        {compassCategories.map(c => (
          <TouchableOpacity key={c.label} onPress={() => ask(`Show me ${c.label.toLowerCase()}`)}
            style={[styles.cat, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={{ fontSize: 18 }}>{c.icon}</Text>
            <Text style={{ color: theme.textPrimary, marginLeft: 6, fontWeight: '600', fontSize: 12 }}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={80}>
        {messages.length === 0 ? (
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ color: theme.textSecondary, marginBottom: 12, fontSize: 13 }}>Try one of these:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {compassSuggestions.map(s => (
                <TouchableOpacity key={s} onPress={() => ask(s)}
                  style={[styles.suggest, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
                  <Text style={{ color: theme.textPrimary, fontSize: 12 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => (
              <View style={{ flexDirection: item.mine ? 'row-reverse' : 'row', marginVertical: 6 }}>
                {!item.mine && <View style={[styles.bot, { backgroundColor: theme.primary }]}><Text>⚽</Text></View>}
                <View style={[styles.msg, { backgroundColor: item.mine ? theme.primary : theme.surface, marginHorizontal: 8 }]}>
                  <Text style={{ color: item.mine ? '#fff' : theme.textPrimary }}>{item.text}</Text>
                  {item.card && (
                    <View style={{ marginTop: 10, padding: 12, borderRadius: 10, backgroundColor: theme.surfaceElevated }}>
                      <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{item.card.name}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{item.card.distance} · ★ {item.card.rating}</Text>
                      <TouchableOpacity style={{ marginTop: 8, backgroundColor: theme.primary, padding: 8, borderRadius: 6 }}>
                        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 12 }}>{item.card.action}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}
          />
        )}

        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity><Icon name="mic-outline" size={22} color={theme.textSecondary} /></TouchableOpacity>
          <TextInput value={text} onChangeText={setText} placeholder="Ask anything..." placeholderTextColor={theme.textMuted}
            style={{ flex: 1, color: theme.textPrimary, marginHorizontal: 10 }} />
          <TouchableOpacity onPress={() => text.trim() && ask(text.trim())} style={[styles.send, { backgroundColor: theme.primary }]}>
            <Icon name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  cat: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  suggest: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  bot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  msg: { maxWidth: '78%', padding: 12, borderRadius: 12 },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, paddingBottom: 24 },
  send: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});
