
import { ConversionState } from '../types';
import { LoggingService } from '@/utils/loggingService';

export const errorWarningActions = (
  set: (state: Partial<ConversionState>) => void,
  get: () => any,
  LoggingService: any
) => {
  // Establecer error
  const setError = (error: string) => {
    const state = get();
    
    // Avoid duplicate errors
    if (state.errors.includes(error)) {
      return;
    }
    
    console.log(`ConversionStore: Setting error: ${error}`);
    
    set({
      status: 'error',
      errors: [...state.errors, error],
      progress: 100 // Set progress to 100 on error to show full error bar
    });
    
    // Log error
    LoggingService.error('conversion', {
      message: 'Error en proceso de conversión',
      error_details: error
    });
  };
  
  // Establecer advertencia
  const setWarning = (warning: string) => {
    const state = get();
    
    // Avoid duplicate warnings
    if (state.warnings.includes(warning)) {
      return;
    }
    
    console.log(`ConversionStore: Adding warning: ${warning}`);
    
    set({
      warnings: [...state.warnings, warning]
    });
    
    // Log warning
    LoggingService.warn('conversion', {
      message: 'Advertencia en proceso de conversión',
      warning_details: warning
    });
  };

  // Limpiar errores
  const clearErrors = () => {
    console.log('ConversionStore: Clearing all errors');
    set({
      errors: [],
      status: get().status === 'error' ? 'idle' : get().status // Reset status if in error state
    });
  };
  
  // Limpiar advertencias
  const clearWarnings = () => {
    console.log('ConversionStore: Clearing all warnings');
    set({
      warnings: []
    });
  };

  return { setError, setWarning, clearErrors, clearWarnings };
};

