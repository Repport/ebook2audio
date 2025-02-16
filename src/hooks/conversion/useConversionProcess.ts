
import { useCallback } from 'react';
import { convertToAudio } from '@/services/conversion';
import { calculateAudioDuration } from '@/services/audio/audioUtils';
import { User } from '@supabase/supabase-js';
import { ExtractedChapter, ConversionResult } from '@/types/conversion';
import { checkExistingConversion } from '@/services/conversion/cacheCheckService';
import { generateHash } from '@/services/conversion/utils';
import { retryOperation } from '@/services/conversion/utils/retryUtils';
import { createProgressTracker } from './utils/progressUtils';
import { convertToChaptersWithTimestamp } from './utils/chapterUtils';
import { createConversionRecord, updateConversionRecord } from './services/conversionRecordService';

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
      
      setConversionStatus('converting');
      setProgress(0);
      setCurrentFileName(fileName);

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

      const conversionId = existingConversionId || (await createConversionRecord(fileName, textHash, user?.id));
      setConversionId(conversionId);

      const totalCharacters = extractedText.length;
      const onChunkProcessed = createProgressTracker(totalCharacters, setProgress);
      const chaptersWithTimestamp = detectChapters ? convertToChaptersWithTimestamp(chapters, totalCharacters) : undefined;

      console.log('Starting audio conversion with voice:', selectedVoice);
      const { audio, id } = await retryOperation(
        () => convertToAudio(
          extractedText, 
          selectedVoice,
          detectChapters ? chaptersWithTimestamp : undefined,
          fileName,
          onChunkProcessed
        ),
        { maxRetries: 3 }
      );

      if (!audio) {
        throw new Error('No audio data received from conversion');
      }

      setAudioData(audio);
      const duration = await calculateAudioDuration(audio);
      setAudioDuration(duration);

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
