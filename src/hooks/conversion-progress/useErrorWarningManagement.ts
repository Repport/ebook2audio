
import { useState } from 'react';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const useErrorWarningManagement = () => {
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const updateErrorsAndWarnings = (data: ChunkProgressData) => {
    if (data.error && !errors.includes(data.error)) {
      setErrors(prev => [...prev, data.error!]);
    }
    
    if (data.warning && !warnings.includes(data.warning)) {
      setWarnings(prev => [...prev, data.warning!]);
    }
  };

  const resetErrorsAndWarnings = () => {
    setErrors([]);
    setWarnings([]);
  };

  return {
    errors,
    warnings,
    updateErrorsAndWarnings,
    resetErrorsAndWarnings
  };
};
