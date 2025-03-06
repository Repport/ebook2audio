
import { useState, useEffect, useRef } from 'react';
import { useConversionStore } from '@/store/conversionStore';
import { subscribeToProgress, getConversionProgress } from '@/services/conversion/progressService';

export const useConversionProgress = (conversionId: string | null) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const updateProgress = useConversionStore(state => state.updateProgress);
  const setError = useConversionStore(state => state.setError);
  const completeConversion = useConversionStore(state => state.completeConversion);
  
  // Referencias para manejo de estado
  const completionCalledRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const prevConversionIdRef = useRef<string | null>(null);
  const lastUpdateTimeRef = useRef(0);
  const UPDATE_THROTTLE_MS = 300;
  
  useEffect(() => {
    // Evitar efecto si conversionId no ha cambiado
    if (conversionId === prevConversionIdRef.current) {
      return;
    }
    
    // Actualizar la referencia
    prevConversionIdRef.current = conversionId;
    
    // Reiniciar bandera de finalización cuando cambia el ID de conversión
    completionCalledRef.current = false;
    
    // Limpiar suscripción anterior
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
    // Si no hay ID de conversión, salir temprano
    if (!conversionId) {
      setIsSubscribed(false);
      return;
    }
    
    console.log(`Setting up progress subscription for ${conversionId}`);
    
    // Obtener progreso inicial
    const fetchInitialProgress = async () => {
      try {
        const progress = await getConversionProgress(conversionId);
        if (progress) {
          updateProgress(progress);
          
          // Si el progreso muestra completado o error, actualizar el store
          if (progress.isCompleted && !completionCalledRef.current) {
            completionCalledRef.current = true;
            completeConversion(null, conversionId, progress.totalCharacters / 15);
          } else if (progress.error) {
            setError(progress.error);
          }
        }
      } catch (error) {
        console.error('Error fetching initial progress:', error);
      }
    };
    
    fetchInitialProgress();
    
    // Procesar actualizaciones con limitación de frecuencia
    const processUpdate = (progressData: any) => {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < UPDATE_THROTTLE_MS) {
        return;
      }
      
      lastUpdateTimeRef.current = now;
      
      console.log('Received progress update:', progressData);
      updateProgress(progressData);
      
      // Solo completar la conversión una vez por suscripción
      if (progressData.isCompleted && !completionCalledRef.current) {
        completionCalledRef.current = true;
        completeConversion(null, conversionId, progressData.totalCharacters / 15);
      } else if (progressData.error) {
        console.error('Error en progreso de conversión:', progressData.error);
        setError(progressData.error);
      }
    };
    
    // Suscribirse a actualizaciones en tiempo real
    const subscription = subscribeToProgress(conversionId, processUpdate);
    
    // Almacenar suscripción para limpieza
    subscriptionRef.current = subscription;
    setIsSubscribed(true);
    
    return () => {
      console.log(`Cleaning up progress subscription for ${conversionId}`);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      setIsSubscribed(false);
    };
  }, [conversionId, updateProgress, setError, completeConversion]);
  
  return { isSubscribed };
};
