# FIFA Rapid Agent 2026

React Native (Expo) app — football match companion with live formation chart,
global chat, fan gallery, AI compass, and stadium safety reporting.

## Setup

```bash
npm install              # or: bun install / yarn install
npx expo start           # then press i (iOS) or a (Android)
```

Requires Expo Go on your device, or an iOS/Android simulator.

## Stack
- Expo SDK 50 / React Native 0.73
- React Navigation 6 (bottom tabs)
- react-native-svg (formation chart pitch)
- react-native-reanimated 3 (player pop-in animations)
- Zustand (state)
- AsyncStorage (theme persistence)
- expo-haptics, expo-linear-gradient

## Project structure
```
App.js
src/
  navigation/TabNavigator.js
  screens/        Live, Chat, Gallery, Compass, Shield
  components/     FormationChart, LiveScoreCapsule, ScreenHeader, ThemeToggle
  store/          Zustand stores
  theme/          colors + typography tokens
  data/mockData.js  Brazil vs Argentina seed data
```

## Centerpiece: FormationChart
`src/components/FormationChart.js` parses any "4-3-3" style formation string,
renders a full SVG pitch with mowing stripes, and positions player markers
with staggered spring entrance animations. Tap any player for a profile sheet.

## Notes
- Mock data only — no backend wired up.
- Designed mobile-first; tablet works but is not optimized.
- Theme toggle persists via AsyncStorage.
