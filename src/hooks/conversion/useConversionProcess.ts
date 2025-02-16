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
    setConversionStatus('converting');
    setProgress(0);
    setCurrentFileName(fileName);
    
    try {
      console.log('Starting conversion process for file:', fileName);
      
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

      // Optimización en el cálculo de timestamps
      let wordCount = 0;
      const chaptersWithTimestamps = chapters.map((chapter, index) => {
        let chapterText = "";

        if ('text' in chapter) {
          chapterText = chapter.text as string;
        } else if (typeof chapter.startIndex === 'number' && chapter.startIndex >= 0) {
          const nextStartIndex = chapters[index + 1]?.startIndex;
          if (typeof nextStartIndex === 'number' && nextStartIndex > chapter.startIndex) {
            chapterText = extractedText.substring(chapter.startIndex, nextStartIndex);
          } else {
            chapterText = extractedText.substring(chapter.startIndex);
          }
        }

        const wordsInChapter = chapterText ? chapterText.split(/\s+/).filter(Boolean).length : 0;
        wordCount += wordsInChapter;

        return {
          ...chapter,
          timestamp: Math.floor(wordCount / 150)
        };
      });

      console.log('Starting audio conversion...');
      
      // Crear callback para tracking de progreso
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

      const { audio, id } = await retryOperation(
        () => convertToAudio(
          extractedText, 
          selectedVoice,
          detectChapters ? chaptersWithTimestamps : undefined,
          fileName,
          onChunkProcessed
        ),
        { maxRetries: 3 }
      );
      
      if (!audio) {
        throw new Error('No audio data received from conversion');
      }

      console.log('Audio conversion successful, creating database record...');
      const { data: conversionRecord, error: createError } = await supabase
        .from('text_conversions')
        .insert({
          user_id: user?.id,
          status: 'completed',
          file_name: fileName,
          text_hash: textHash,
          progress: 100,
          notify_on_complete: false,
          processed_characters: totalCharacters,
          total_characters: totalCharacters
        })
        .select()
        .single();

      if (createError || !conversionRecord) {
        throw new Error('Failed to create conversion record');
      }

      setConversionId(conversionRecord.id);

      if (detectChapters && chapters.length > 0) {
        const chapterInserts = chaptersWithTimestamps.map(chapter => ({
          conversion_id: id,
          title: chapter.title,
          start_index: chapter.startIndex,
          timestamp: chapter.timestamp
        }));

        const chaptersResponse = await retryOperation(
          async () => supabase.from('chapters').insert(chapterInserts),
          { maxRetries: 3 }
        );

        if (chaptersResponse.error) {
          console.error('❌ Error storing chapters:', chaptersResponse.error);
          toast({
            title: "Warning",
            description: "Audio conversion successful but chapter markers couldn't be saved. Try refreshing the page.",
            variant: "destructive",
            action: {
              label: "Refresh",
              onClick: () => window.location.reload()
            }
          });
        }
      }

      setConversionId(id);
      setAudioData(audio);
      
      const duration = await calculateAudioDuration(audio);
      setAudioDuration(duration);
      
      if (user) {
        console.log('Saving to Supabase for user:', user.id);
        await saveToSupabase(audio, extractedText, duration, fileName, user.id);
      }
      
      try {
        await retryOperation(
          async () => {
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
          },
          { maxRetries: 3 }
        );
      } catch (error) {
        console.error('Failed to update conversion status:', error);
        toast({
          title: "Warning",
          description: "Conversion successful but status update failed. Try refreshing the page.",
          variant: "destructive",
          action: {
            label: "Refresh",
            onClick: () => window.location.reload()
          }
        });
      }
      
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
