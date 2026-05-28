import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import UserAvatar from './UserAvatar';
import ProfileSheet from './ProfileSheet';

export default function ScreenHeader({ title, subtitle, right }) {
  const { theme } = useThemeStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <View style={[styles.row, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
        {/* Title block */}
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '700' }}>{title}</Text>
          {subtitle
            ? <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
            : null}
        </View>

        {/* Optional extra right slot */}
        {right}

        {/* User Avatar — always shown, tap → ProfileSheet */}
        <UserAvatar
          size={36}
          showOnlineDot={true}
          onPress={() => setSheetOpen(true)}
        />
      </View>

      {/* Profile / Settings sheet */}
      <ProfileSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
});
