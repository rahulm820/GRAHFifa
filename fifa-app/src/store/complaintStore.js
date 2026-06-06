import { create } from 'zustand';
import { complaints } from '../data/mockData';
export const useComplaintStore = create((set) => ({
  items: complaints,
  add: (c) => set((s) => ({ items: [{ ...c, id: String(Date.now()), time: 'now', status: 'Open', upvotes: 0 }, ...s.items] })),
  upvote: (id) => set((s) => ({ items: s.items.map(i => i.id === id ? { ...i, upvotes: i.upvotes + 1 } : i) })),
}));
