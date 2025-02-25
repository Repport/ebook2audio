
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversionState } from './useConversionState';
import { useConversionActions } from './useConversionActions';
import { supabase } from '@/integrations/supabase/client';
import { fetchFromCache } from '@/services/conversion/storage/cacheStorage';
import { TextChunkCallback } from '@/services/conversion/types/chunks';

export const useAudioConversion = () => {
  const { user } = useAuth();
  const {
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    currentFileName,
    conversionId,
    setProgress,
    setConversionStatus,
    setAudioData,
    setAudioDuration,
    setCurrentFileName,
    setConversionId,
    toast
  } = useConversionState();

  const {
    handleConversion: baseHandleConversion,
    handleDownload,
    resetConversion
  } = useConversionActions({
    user,
    toast,
    conversionStatus,
    audioData,
    currentFileName,
    setConversionStatus,
    setProgress,
    setAudioData,
    setAudioDuration,
    setCurrentFileName,
    setConversionId
  });

  // Wrap handleConversion to allow progress callback
  const handleConversion = useCallback(async (
    extractedText: string,
    selectedVoice: string,
    detectChapters: boolean,
    chapters: any[],
    fileName: string,
    onProgress?: TextChunkCallback
  ) => {
    console.log('Starting conversion with progress callback');
    try {
      // Asegurarnos de que el estado sea 'converting'
      setConversionStatus('converting');
      
      const result = await baseHandleConversion(
        extractedText,
        selectedVoice,
        detectChapters,
        chapters,
        fileName,
        onProgress
      );
      
      // Asegurarnos de que el estado se actualice después de la conversión
      if (result) {
        console.log('Conversion successful, updating status');
        setConversionStatus('completed');
        setProgress(100);
        
        // Si onProgress está disponible, notificar que la conversión está completa
        if (onProgress) {
          onProgress({
            progress: 100,
            isCompleted: true
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Conversion error in wrapper:', error);
      setConversionStatus('error');
      throw error;
    }
  }, [baseHandleConversion, setConversionStatus, setProgress]);

  // Recuperar audio del storage cuando sea necesario
  useEffect(() => {
    const fetchAudioFromStorage = async () => {
      if (conversionStatus === 'completed' && !audioData && conversionId) {
        try {
          // Obtener la ruta de storage
          const { data: conversion } = await supabase
            .from('text_conversions')
            .select('storage_path')
            .eq('id', conversionId)
            .single();

          if (conversion?.storage_path) {
            const { data: audioBuffer, error } = await fetchFromCache(conversion.storage_path);
            
            if (error) {
              console.error('Error fetching audio from storage:', error);
              toast({
                title: "Error",
                description: "No se pudo recuperar el audio almacenado",
                variant: "destructive",
              });
              return;
            }

            if (audioBuffer) {
              console.log('Audio retrieved from storage, setting audio data');
              setAudioData(audioBuffer);
            }
          }
        } catch (error) {
          console.error('Error fetching conversion data:', error);
        }
      }
    };

    fetchAudioFromStorage();
  }, [conversionStatus, audioData, conversionId, setAudioData, toast]);

  // Add timeout for stuck conversions
  useEffect(() => {
    let timeoutId: number;
    
    if (conversionStatus === 'converting' && progress === 100) {
      timeoutId = window.setTimeout(() => {
        console.log('Conversion appears to be stuck at 100%, forcing completion');
        setConversionStatus('completed');
      }, 5000); // Reducido a 5 segundos para detectar más rápido conversiones estancadas
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [conversionStatus, progress, setConversionStatus]);

  // Añadir logs para depuración
  useEffect(() => {
    console.log('useAudioConversion - status/progress update:', {
      status: conversionStatus,
      progress,
      hasAudioData: !!audioData
    });
  }, [conversionStatus, progress, audioData]);

  return {
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    currentFileName,
    conversionId,
    handleConversion,
    handleDownload,
    resetConversion,
    setProgress,
    setConversionStatus,
    setAudioData,
    setAudioDuration,
    setCurrentFileName
  };
};
