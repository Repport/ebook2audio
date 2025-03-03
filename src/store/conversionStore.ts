
import { create } from 'zustand';
import { ConversionStore } from './conversion/types';
import { initialState } from './conversion/initialState';
import { createConversionActions } from './conversion/actions';

export { useConversionTimer } from './conversion/useConversionTimer';
export type { ConversionStatus } from './conversion/types';

// Create store
export const useConversionStore = create<ConversionStore>((set, get) => ({
  ...initialState,
  ...createConversionActions(set, get)
}));
