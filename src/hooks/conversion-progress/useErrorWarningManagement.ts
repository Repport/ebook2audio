
import { useState } from 'react';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const useErrorWarningManagement = () => {
  // Estado para errores y advertencias
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  // Conjunto para rastrear errores únicos (evita duplicados)
  const uniqueErrorsSet = new Set<string>();
  const uniqueWarningsSet = new Set<string>();
  
  // Actualizar errores y advertencias a partir de datos de progreso
  const updateErrorsAndWarnings = (data: ChunkProgressData) => {
    if (!data) return;
    
    // Manejar errores
    if (data.error && typeof data.error === 'string' && data.error.trim() !== '') {
      // Evitar agregar el mismo error varias veces
      if (!uniqueErrorsSet.has(data.error)) {
        console.warn(`[useErrorWarningManagement] New error detected: ${data.error}`);
        uniqueErrorsSet.add(data.error);
        setErrors(prev => [...prev, data.error as string]);
      }
    }
    
    // Manejar advertencias
    if (data.warning && typeof data.warning === 'string' && data.warning.trim() !== '') {
      // Evitar agregar la misma advertencia varias veces
      if (!uniqueWarningsSet.has(data.warning)) {
        console.log(`[useErrorWarningManagement] New warning detected: ${data.warning}`);
        uniqueWarningsSet.add(data.warning);
        setWarnings(prev => [...prev, data.warning as string]);
      }
    }
    
    // Verificar si hay errores indirectos
    if (data.processedChunks !== undefined && 
        data.totalChunks !== undefined && 
        data.processedChunks < data.totalChunks && 
        data.isCompleted === true) { // Cambiado de data.status === 'completed' a data.isCompleted === true
      const missingChunksWarning = `Se completaron solo ${data.processedChunks} de ${data.totalChunks} fragmentos de texto. El audio puede estar incompleto.`;
      
      if (!uniqueWarningsSet.has(missingChunksWarning)) {
        console.warn(`[useErrorWarningManagement] ${missingChunksWarning}`);
        uniqueWarningsSet.add(missingChunksWarning);
        setWarnings(prev => [...prev, missingChunksWarning]);
      }
    }
  };
  
  // Resetear errores y advertencias
  const resetErrorsAndWarnings = () => {
    console.log('[useErrorWarningManagement] Resetting all errors and warnings');
    uniqueErrorsSet.clear();
    uniqueWarningsSet.clear();
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
