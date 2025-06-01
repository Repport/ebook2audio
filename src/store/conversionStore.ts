import { create } from 'zustand';
import { ConversionStore } from './conversion/types';
import { initialState } from './conversion/initialState';
import { createConversionActions } from './conversion/actions/createConversionActions';

export type { ConversionStatus } from './conversion/types';

// Crear store con anotación de tipo explícita
export const useConversionStore = create<ConversionStore>((set, get) => {
  // Primero crear todas las acciones
  const actions = createConversionActions(set, get);
  
  // Luego devolver el estado y las acciones combinadas
  return {
    ...initialState,
    ...actions
  };
});
