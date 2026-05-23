import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import LiveScreen from '../screens/LiveScreen';
import ChatScreen from '../screens/ChatScreen';
import GalleryScreen from '../screens/GalleryScreen';
import CompassScreen from '../screens/CompassScreen';
import ShieldScreen from '../screens/ShieldScreen';
import { useThemeStore } from '../store/themeStore';

const Tab = createBottomTabNavigator();

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
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="football" size={size} color={color} /> }} />
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
