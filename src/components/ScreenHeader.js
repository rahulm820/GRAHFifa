import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import ThemeToggle from './ThemeToggle';

export default function ScreenHeader({ title, subtitle, right }) {
  const { theme } = useThemeStore();
  return (
    <View style={[styles.row, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '700' }}>{title}</Text>
        {subtitle ? <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {right}
      <ThemeToggle />
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14, borderBottomWidth: 1 },
});
