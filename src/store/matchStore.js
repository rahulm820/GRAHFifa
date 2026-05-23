import { create } from 'zustand';
import { matchData, matchEvents, matchStats, brazilSquad, argentinaSquad } from '../data/mockData';
export const useMatchStore = create(() => ({
  match: matchData,
  events: matchEvents,
  stats: matchStats,
  homeSquad: brazilSquad,
  awaySquad: argentinaSquad,
}));
