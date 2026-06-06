import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../store/themeStore';

export default function ThemeToggle() {
  const { theme, isDark, toggle } = useThemeStore();
  return (
    <TouchableOpacity
      onPress={() => { Haptics.selectionAsync(); toggle(); }}
      style={{ padding: 8 }}
    >
      <Icon name={isDark ? 'sunny' : 'moon'} size={22} color={theme.accent} />
    </TouchableOpacity>
  );
}
