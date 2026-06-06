import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import LiveScreen from '../screens/LiveScreen';
import ChatScreen from '../screens/ChatScreen';
import GalleryScreen from '../screens/GalleryScreen';
import CompassScreen from '../screens/CompassScreen';
import ShieldScreen from '../screens/ShieldScreen';
import { useThemeStore } from '../store/themeStore';
import { useMatchStore } from '../store/matchStore';

const Tab = createBottomTabNavigator();

// ─── Pulsing red dot badge for live indicator ─────────────────────────────────
function LiveDotBadge() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[tabStyles.liveDot, { opacity: pulse }]} />
  );
}

// ─── Custom icon wrapper for the Live tab ─────────────────────────────────────
function LiveTabIcon({ color, size }) {
  const { isLive } = useMatchStore();

  return (
    <View style={tabStyles.iconWrapper}>
      <Ionicons name="football" size={size} color={color} />
      {isLive && <LiveDotBadge />}
    </View>
  );
}

export default function TabNavigator() {
  const { theme } = useThemeStore();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border, height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Live" component={LiveScreen}
        options={{ tabBarIcon: (props) => <LiveTabIcon {...props} /> }} />
      <Tab.Screen name="Chat" component={ChatScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} /> }} />
      <Tab.Screen name="Gallery" component={GalleryScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="images" size={size} color={color} /> }} />
      <Tab.Screen name="Compass" component={CompassScreen}
        options={{ tabBarIcon: ({ color, size }) => <MCI name="map-marker-radius" size={size} color={color} /> }} />
      <Tab.Screen name="Shield" component={ShieldScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  iconWrapper: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#e84040',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});
