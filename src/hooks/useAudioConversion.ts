
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversionState } from './useConversionState';
import { useConversionActions } from './useConversionActions';
import { supabase } from '@/integrations/supabase/client';
import { fetchFromCache } from '@/services/conversion/storage/cacheStorage';

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
    handleConversion,
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
              setAudioData(audioBuffer);
            }
          }
        } catch (error) {
          console.error('Error fetching conversion data:', error);
        }
      }
    };

    fetchAudioFromStorage();
  }, [conversionStatus, audioData, conversionId]);

  // Add timeout for stuck conversions
  useEffect(() => {
    let timeoutId: number;
    
    if (conversionStatus === 'converting' && progress === 100) {
      timeoutId = window.setTimeout(() => {
        resetConversion();
        toast({
          title: "Conversion timed out",
          description: "Please try again",
          variant: "destructive",
        });
      }, 60000); // Reset after 1 minute of being stuck
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [conversionStatus, progress, resetConversion, toast]);

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
