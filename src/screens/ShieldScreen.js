import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '../components/ScreenHeader';
import { useThemeStore } from '../store/themeStore';
import { useComplaintStore } from '../store/complaintStore';

const COMPLAINT_TYPES = [
  { label: 'Physical', icon: 'boxing-glove' },
  { label: 'Harassment', icon: 'account-alert' },
  { label: 'Intoxication', icon: 'glass-mug-variant' },
  { label: 'Fake services', icon: 'shield-alert' },
  { label: 'Racism', icon: 'hand-back-left-off' },
  { label: 'Lost item', icon: 'bag-personal' },
  { label: 'Medical', icon: 'medical-bag' },
  { label: 'Other', icon: 'dots-horizontal' },
];

const PRIORITY_COLOR = { CRITICAL: '#D63B3B', HIGH: '#E8843A', MEDIUM: '#E8C53A', LOW: '#9E9E9E' };

export default function ShieldScreen() {
  const { theme } = useThemeStore();
  const { items, add, upvote } = useComplaintStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState({ type: '', section: '', row: '', desc: '', anon: true });
  const [showMap, setShowMap] = useState(false);

  const critical = items.filter(i => i.priority === 'CRITICAL' && i.status !== 'Resolved').length;

  const submit = () => {
    add({ ...draft, type: draft.type, icon: COMPLAINT_TYPES.find(t => t.label === draft.type)?.icon, priority: 'MEDIUM' });
    setOpen(false); setStep(1); setDraft({ type: '', section: '', row: '', desc: '', anon: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="Stadium Safety" subtitle="Report incidents · Stay aware"
        right={
          <TouchableOpacity onPress={() => setShowMap(!showMap)} style={{ padding: 8 }}>
            <IonIcon name={showMap ? 'list' : 'map'} size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        } />

      {critical > 0 && (
        <View style={[styles.alert, { backgroundColor: theme.danger + '22', borderColor: theme.danger }]}>
          <Text style={{ color: theme.danger, fontWeight: '600' }}>⚠️ {critical} critical reports nearby</Text>
        </View>
      )}

      {!showMap ? (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 120 }}>
          {items.map(c => (
            <View key={c.id} style={[styles.card, { backgroundColor: theme.surface, borderTopColor: PRIORITY_COLOR[c.priority] }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name={c.icon} size={28} color={PRIORITY_COLOR[c.priority]} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{c.type}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Section {c.section} · Row {c.row} · {c.time}</Text>
                </View>
                <View style={[styles.priority, { backgroundColor: PRIORITY_COLOR[c.priority] }]}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{c.priority}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <View style={[styles.status, { backgroundColor: theme.surfaceElevated }]}>
                  <Text style={{ color: c.status === 'Resolved' ? theme.success : theme.textSecondary, fontSize: 11, fontWeight: '600' }}>
                    {c.status === 'Resolved' ? '✓ ' : ''}{c.status}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => upvote(c.id)}>
                  <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '600' }}>↑ {c.upvotes} helped</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 12, fontSize: 12 }}>Safety heatmap by section</Text>
          {Array.from({ length: 8 }).map((_, r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {Array.from({ length: 8 }).map((_, c) => {
                const heat = ((r * 8 + c) * 13) % 100;
                const color = heat > 70 ? theme.danger : heat > 40 ? '#E8C53A' : theme.success;
                return <View key={c} style={{ flex: 1, aspectRatio: 1, backgroundColor: color, margin: 1, borderRadius: 2, opacity: 0.6 }} />;
              })}
            </View>
          ))}
          <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-around' }}>
            <Text style={{ color: theme.success, fontSize: 11 }}>● Safe</Text>
            <Text style={{ color: '#E8C53A', fontSize: 11 }}>● Caution</Text>
            <Text style={{ color: theme.danger, fontSize: 11 }}>● Active</Text>
          </View>
        </View>
      )}

      <TouchableOpacity onPress={() => setOpen(true)} style={[styles.fab, { backgroundColor: theme.danger }]}>
        <Icon name="shield-plus" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700' }}>Report — Step {step}/3</Text>
              <TouchableOpacity onPress={() => { setOpen(false); setStep(1); }}>
                <IonIcon name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {step === 1 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {COMPLAINT_TYPES.map(t => (
                  <TouchableOpacity key={t.label}
                    onPress={() => { setDraft({ ...draft, type: t.label }); setStep(2); }}
                    style={[styles.typeCard, { backgroundColor: draft.type === t.label ? theme.primary : theme.surfaceElevated }]}>
                    <Icon name={t.icon} size={28} color={draft.type === t.label ? '#fff' : theme.textPrimary} />
                    <Text style={{ color: draft.type === t.label ? '#fff' : theme.textPrimary, fontSize: 11, marginTop: 6 }}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {step === 2 && (
              <View>
                <TextInput placeholder="Describe what happened..." placeholderTextColor={theme.textMuted}
                  multiline value={draft.desc} onChangeText={(v) => setDraft({ ...draft, desc: v })}
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, height: 80 }]} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput placeholder="Section" placeholderTextColor={theme.textMuted}
                    value={draft.section} onChangeText={(v) => setDraft({ ...draft, section: v })}
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, flex: 1 }]} />
                  <TextInput placeholder="Row" placeholderTextColor={theme.textMuted}
                    value={draft.row} onChangeText={(v) => setDraft({ ...draft, row: v })}
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, flex: 1 }]} />
                </View>
                <TouchableOpacity onPress={() => setStep(3)} style={[styles.nextBtn, { backgroundColor: theme.primary }]}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Next</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 3 && (
              <View>
                <Text style={{ color: theme.textPrimary, fontWeight: '700', marginBottom: 8 }}>Summary</Text>
                <Text style={{ color: theme.textSecondary }}>Type: {draft.type}</Text>
                <Text style={{ color: theme.textSecondary }}>Location: Section {draft.section}, Row {draft.row}</Text>
                <Text style={{ color: theme.textSecondary, marginBottom: 12 }}>Details: {draft.desc}</Text>
                <TouchableOpacity onPress={() => setDraft({ ...draft, anon: !draft.anon })}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={[styles.checkbox, { borderColor: theme.primary, backgroundColor: draft.anon ? theme.primary : 'transparent' }]} />
                  <Text style={{ color: theme.textPrimary, marginLeft: 8 }}>Submit anonymously</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={submit} style={[styles.nextBtn, { backgroundColor: theme.success }]}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>✓ Submit Report</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: { padding: 12, marginHorizontal: 12, marginTop: 8, borderRadius: 8, borderLeftWidth: 3 },
  card: { padding: 14, marginVertical: 6, borderRadius: 10, borderTopWidth: 3 },
  priority: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  status: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  fab: { position: 'absolute', right: 20, bottom: 90, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  sheet: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  typeCard: { width: '23%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },
  nextBtn: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  checkbox: { width: 20, height: 20, borderWidth: 2, borderRadius: 4 },
});
