import React, { useEffect } from 'react';
import { View, StatusBar, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import LiveScoreCapsule from './src/components/LiveScoreCapsule';
import { useThemeStore } from './src/store/themeStore';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  const { theme, isDark, init: initTheme } = useThemeStore();
  const { isLoggedIn, isLoading, init: initAuth } = useAuthStore();

  useEffect(() => {
    initTheme();
    const unsubscribe = initAuth(); // Firebase returns unsubscribe function
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: theme.background,
      card: theme.surface,
      text: theme.textPrimary,
      border: theme.border,
      primary: theme.primary,
    },
  };

  // Show a blank loading screen while restoring auth state
  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0A0F0A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2DB555" />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <NavigationContainer theme={navTheme}>
          {isLoggedIn ? (
            <View style={{ flex: 1 }}>
              <TabNavigator />
              <LiveScoreCapsule />
            </View>
          ) : (
            <AuthNavigator />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
