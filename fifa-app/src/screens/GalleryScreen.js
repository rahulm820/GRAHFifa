import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '../components/ScreenHeader';
import { useThemeStore } from '../store/themeStore';
import { useGalleryStore } from '../store/galleryStore';

export default function GalleryScreen() {
  const { theme } = useThemeStore();
  const { items, filters } = useGalleryStore();
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="Gallery" subtitle="Fan moments · AI tagged" />
      <View style={{ padding: 12 }}>
        <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Icon name="search" size={16} color={theme.textMuted} />
          <TextInput placeholder="Search by player, moment, section..." placeholderTextColor={theme.textMuted}
            style={{ flex: 1, marginLeft: 8, color: theme.textPrimary }} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {filters.map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              style={[styles.chip, { backgroundColor: filter === f ? theme.primary : theme.surface, borderColor: theme.border }]}>
              <Text style={{ color: filter === f ? '#fff' : theme.textSecondary, fontWeight: '600', fontSize: 12 }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={items}
        numColumns={3}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 8, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelected(item)} style={styles.tile}>
            <View style={[styles.tileImg, { backgroundColor: `hsl(${item.hue}, 30%, 35%)` }]}>
              {item.archive && <Text style={styles.archive}>⭐</Text>}
              <View style={styles.tileOverlay}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {item.tags.map(t => (
                    <View key={t} style={styles.tag}><Text style={{ color: '#fff', fontSize: 9 }}>{t}</Text></View>
                  ))}
                </View>
                <Text style={{ color: '#fff', fontSize: 10, position: 'absolute', bottom: 4, right: 6 }}>♥ {item.likes}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]}>
        <Icon name="camera" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity onPress={() => setSelected(null)} style={{ position: 'absolute', top: 50, left: 16, zIndex: 10 }}>
            <Icon name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          {selected && (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={{ aspectRatio: 1, backgroundColor: `hsl(${selected.hue}, 30%, 35%)` }} />
              <View style={{ padding: 20 }}>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                  {selected.tags.map(t => (
                    <View key={t} style={{ backgroundColor: theme.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                      <Text style={{ color: '#fff', fontSize: 11 }}>{t}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 24 }}>
                  <Text style={{ color: '#fff' }}>♥ {selected.likes}</Text>
                  <Text style={{ color: '#fff' }}>↗ Share</Text>
                  <Text style={{ color: '#fff' }}>↓ Download</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 10, borderWidth: 1 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8, borderWidth: 1 },
  tile: { flex: 1 / 3, padding: 4 },
  tileImg: { aspectRatio: 1, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  tileOverlay: { padding: 6, backgroundColor: 'rgba(0,0,0,0.3)' },
  tag: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  archive: { position: 'absolute', top: 4, right: 6, fontSize: 14 },
  fab: { position: 'absolute', right: 20, bottom: 90, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
});
