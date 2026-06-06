import { create } from 'zustand';
import { galleryItems } from '../data/mockData';
export const useGalleryStore = create(() => ({
  items: galleryItems,
  filters: ['All', 'Goals', 'Celebrations', 'Crowd', 'Saves'],
}));
