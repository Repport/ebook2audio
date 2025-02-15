
import { useCallback } from 'react';
import { convertToAudio } from '@/services/conversion';
import { saveToSupabase } from '@/services/storage/supabaseStorageService';
import { calculateAudioDuration } from '@/services/audio/audioUtils';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';
import { User } from '@supabase/supabase-js';
import { ExtractedChapter, TextConversion, PostgrestResponse, DatabaseChapter } from '@/types/conversion';
import { supabase } from '@/integrations/supabase/client';
import { checkExistingConversion } from '@/services/conversion/cacheCheckService';
import { generateHash } from '@/services/conversion/utils';
import { retryOperation, safeSupabaseUpdate } from '@/services/conversion/utils/retryUtils';

interface UseConversionActionsProps {
  user: User | null;
  toast: any;
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error';
  audioData: ArrayBuffer | null;
  currentFileName: string | null;
  setConversionStatus: (status: 'idle' | 'converting' | 'completed' | 'error') => void;
  setProgress: (progress: number) => void;
  setAudioData: (data: ArrayBuffer | null) => void;
  setAudioDuration: (duration: number) => void;
  setCurrentFileName: (name: string | null) => void;
  setConversionId: (id: string | null) => void;
}

interface ConversionResult {
  audio: ArrayBuffer;
  id: string;
}

const retryDownload = async (
  fn: () => void, 
  retries = 3,
  toast: any
) => {
  for (let i = 0; i < retries; i++) {
    try {
      fn();
      return;
    } catch (error) {
      console.warn(`⚠️ Retry download attempt ${i + 1} failed`, error);
      if (i === retries - 1) {
        toast({
          title: "Download failed",
          description: "Could not generate the download file. Please try again.",
          variant: "destructive",
        });
      }
      await new Promise(res => setTimeout(res, 1000));
    }
  }
};

export const useConversionActions = ({
  user,
  toast,
  audioData,
  currentFileName,
  setConversionStatus,
  setProgress,
  setAudioData,
  setAudioDuration,
  setCurrentFileName,
  setConversionId
}: UseConversionActionsProps) => {
  const resetConversion = useCallback(() => {
    setConversionStatus('idle');
    setProgress(0);
    setAudioData(null);
    setAudioDuration(0);
    setCurrentFileName(null);
    setConversionId(null);
    clearConversionStorage();
  }, [setConversionStatus, setProgress, setAudioData, setAudioDuration, setCurrentFileName, setConversionId]);

  const handleConversion = async (
    extractedText: string,
    selectedVoice: string,
    detectChapters: boolean,
    chapters: ExtractedChapter[],
    fileName: string
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
          id: conversion.id 
        };
      }

      // Optimización en el cálculo de timestamps
      let wordCount = 0;
      const chaptersWithTimestamps = chapters.map(chapter => {
        if ('text' in chapter) {
          wordCount += (chapter.text as string).split(/\s+/).length;
        } else {
          // Si no hay texto, calcular desde el extractedText
          const chapterText = extractedText.substring(
            chapter.startIndex,
            chapters[chapters.indexOf(chapter) + 1]?.startIndex || extractedText.length
          );
          wordCount += chapterText.split(/\s+/).length;
        }
        return {
          ...chapter,
          timestamp: Math.floor(wordCount / 150)
        };
      });

      // Primero intentamos la conversión antes de crear el registro
      console.log('Starting audio conversion...');
      const { audio, id } = await retryOperation(
        () => convertToAudio(
          extractedText, 
          selectedVoice,
          detectChapters ? chaptersWithTimestamps : undefined,
          fileName
        ),
        { maxRetries: 3 }
      );
      
      if (!audio) {
        throw new Error('No audio data received from conversion');
      }

      // Solo después de una conversión exitosa, creamos el registro
      console.log('Audio conversion successful, creating database record...');
      const { data: conversionRecord, error: createError } = await supabase
        .from('text_conversions')
        .insert({
          user_id: user?.id,
          status: 'completed', // Ya sabemos que la conversión fue exitosa
          file_name: fileName,
          text_hash: textHash,
          progress: 100,
          notify_on_complete: false
        })
        .select()
        .single();

      if (createError || !conversionRecord) {
        throw new Error('Failed to create conversion record');
      }

      setConversionId(conversionRecord.id);

      if (detectChapters && chapters.length > 0) {
        const chapterInserts: DatabaseChapter[] = chaptersWithTimestamps.map(chapter => ({
          conversion_id: id,
          title: chapter.title,
          start_index: chapter.startIndex,
          timestamp: chapter.timestamp
        }));

        const chaptersResponse = await retryOperation<PostgrestResponse<DatabaseChapter>>(
          async () => {
            const response = await supabase.from('chapters').insert(chapterInserts);
            return response;
          },
          { maxRetries: 3 }
        );

        if (chaptersResponse.error) {
          console.error('❌ Error storing chapters:', chaptersResponse.error);
          toast({
            title: "Warning",
            description: "Audio conversion successful but chapter markers couldn't be saved.",
            variant: "destructive",
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
                duration
              }
            );
          },
          { maxRetries: 3 }
        );
      } catch (error) {
        console.error('Failed to update conversion status:', error);
        toast({
          title: "Warning",
          description: "Conversion successful but status update failed. Some features might be limited.",
          variant: "destructive",
        });
      }
      
      setConversionStatus('completed');
      setProgress(100);

      return { audio, id };

    } catch (error) {
      console.error('Conversion error:', error);
      setConversionStatus('error');
      setProgress(0);
      setCurrentFileName(null);
      setAudioData(null);
      throw error;
    }
  };

  const handleDownload = async (fileName: string) => {
    if (!audioData) return;

    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const sanitizedFileName = (fileName || currentFileName || 'converted')
      .replace(/[<>:"/\\|?*]+/g, '') 
      .replace(/\s+/g, '_')
      .substring(0, 255);
    
    const baseName = sanitizedFileName.substring(0, sanitizedFileName.lastIndexOf('.') || sanitizedFileName.length);
    link.download = `${baseName}.mp3`;
    
    await retryDownload(
      () => {
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      3,
      toast
    );
  };

  return {
    handleConversion,
    handleDownload,
    resetConversion
  };
};
