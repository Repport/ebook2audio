
import { create } from 'zustand';
import { ConversionStore } from './conversion/types';
import { initialState } from './conversion/initialState';
import { createConversionActions } from './conversion/actions';

export { useConversionTimer } from './conversion/useConversionTimer';
export type { ConversionStatus } from './conversion/types';

// Create store with explicit type annotation
export const useConversionStore = create<ConversionStore>((set, get) => {
  // First create all the actions
  const actions = createConversionActions(set, get);
  
  // Then return the combined state and actions
  return {
    ...initialState,
    ...actions
  };
});
