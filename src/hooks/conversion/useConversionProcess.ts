
import { useCallback } from 'react';
import { convertToAudio } from '@/services/conversion';
import { saveToSupabase } from '@/services/storage/supabaseStorageService';
import { calculateAudioDuration } from '@/services/audio/audioUtils';
import { User } from '@supabase/supabase-js';
import { ExtractedChapter, ConversionResult } from '@/types/conversion';
import { checkExistingConversion } from '@/services/conversion/cacheCheckService';
import { generateHash } from '@/services/conversion/utils';
import { retryOperation, safeSupabaseUpdate } from '@/services/conversion/utils/retryUtils';
import { supabase } from '@/integrations/supabase/client';
import { TextChunkCallback } from '@/services/conversion/types/chunks';

interface UseConversionProcessProps {
  user: User | null;
  toast: any;
  setConversionStatus: (status: 'idle' | 'converting' | 'completed' | 'error') => void;
  setProgress: (progress: number) => void;
  setAudioData: (data: ArrayBuffer | null) => void;
  setAudioDuration: (duration: number) => void;
  setCurrentFileName: (name: string | null) => void;
  setConversionId: (id: string | null) => void;
}

export const useConversionProcess = ({
  user,
  toast,
  setConversionStatus,
  setProgress,
  setAudioData,
  setAudioDuration,
  setCurrentFileName,
  setConversionId
}: UseConversionProcessProps) => {
  return useCallback(async (
    extractedText: string,
    selectedVoice: string,
    detectChapters: boolean,
    chapters: ExtractedChapter[],
    fileName: string,
    existingConversionId?: string
  ): Promise<ConversionResult> => {
    try {
      console.log('Starting conversion process for file:', fileName);
      
      // Set initial state
      setConversionStatus('converting');
      setProgress(0);
      setCurrentFileName(fileName);

      // Check for existing conversion first
      const textHash = await generateHash(extractedText, selectedVoice);
      console.log('Generated text hash:', textHash);
      
      const existingConversion = await checkExistingConversion(textHash);
      
      if (existingConversion) {
        console.log('⚡ Found existing conversion in cache');
        const { conversion, audioBuffer } = existingConversion;
        
        setConversionId(conversion.id);
        setAudioData(audioBuffer);
        
        const duration = await calculateAudioDuration(audioBuffer);
        setAudioDuration(duration);
        
        setConversionStatus('completed');
        setProgress(100);
        
        toast({
          title: "Using cached version",
          description: "This document has been converted before. Using the cached version to save time.",
        });
        
        return { 
          audio: audioBuffer, 
          id: conversion.id,
          duration 
        };
      }

      // Create or use existing conversion record
      const conversionId = existingConversionId || (await createConversionRecord(fileName, textHash, user?.id));
      setConversionId(conversionId);

      // Set up progress tracking
      let processedCharacters = 0;
      const totalCharacters = extractedText.length;
      
      const onChunkProcessed: TextChunkCallback = (chunkText, processed, total) => {
        processedCharacters = processed;
        const progress = Math.min(
          Math.round((processedCharacters / totalCharacters) * 90) + 5,
          95
        );
        console.log(`📊 Progress update: ${progress}% (${processedCharacters}/${totalCharacters} characters)`);
        setProgress(progress);
      };

      // Start the actual conversion
      console.log('Starting audio conversion with voice:', selectedVoice);
      const { audio, id } = await retryOperation(
        () => convertToAudio(
          extractedText, 
          selectedVoice,
          detectChapters ? chapters : undefined,
          fileName,
          onChunkProcessed
        ),
        { maxRetries: 3 }
      );

      if (!audio) {
        throw new Error('No audio data received from conversion');
      }

      // Update state with the result
      setAudioData(audio);
      const duration = await calculateAudioDuration(audio);
      setAudioDuration(duration);

      // Update conversion record
      await updateConversionRecord(id, duration, totalCharacters);

      setConversionStatus('completed');
      setProgress(100);

      return { audio, id, duration };

    } catch (error) {
      console.error('Conversion error:', error);
      setConversionStatus('error');
      setProgress(0);
      setCurrentFileName(null);
      setAudioData(null);
      throw error;
    }
  }, [user, setConversionStatus, setProgress, setCurrentFileName, setAudioData, setAudioDuration, setConversionId, toast]);
};

async function createConversionRecord(fileName: string, textHash: string, userId?: string) {
  const { data: conversionRecord, error } = await supabase
    .from('text_conversions')
    .insert({
      file_name: fileName,
      status: 'processing',
      text_hash: textHash,
      user_id: userId,
      progress: 0,
      processed_characters: 0,
      total_characters: 0
    })
    .select()
    .single();

  if (error || !conversionRecord) {
    throw new Error('Failed to create conversion record');
  }

  return conversionRecord.id;
}

async function updateConversionRecord(id: string, duration: number, totalCharacters: number) {
  await safeSupabaseUpdate(
    supabase,
    'text_conversions',
    id,
    {
      status: 'completed',
      progress: 100,
      duration,
      processed_characters: totalCharacters,
      total_characters: totalCharacters
    }
  );
}
