import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../theme/colors';

export const useThemeStore = create((set, get) => ({
  isDark: true,
  theme: darkTheme,
  toggle: async () => {
    const next = !get().isDark;
    set({ isDark: next, theme: next ? darkTheme : lightTheme });
    try { await AsyncStorage.setItem('isDark', String(next)); } catch {}
  },
  init: async () => {
    try {
      const v = await AsyncStorage.getItem('isDark');
      if (v !== null) {
        const isDark = v === 'true';
        set({ isDark, theme: isDark ? darkTheme : lightTheme });
      }
    } catch {}
  },
}));
