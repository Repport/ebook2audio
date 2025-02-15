
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

      console.log('No cached version found, creating new conversion record');
      const { data: conversionRecord, error: createError } = await supabase
        .from('text_conversions')
        .insert({
          user_id: user?.id,
          status: 'processing',
          file_name: fileName,
          text_hash: textHash,
          progress: 0,
          notify_on_complete: false
        })
        .select()
        .single();

      if (createError || !conversionRecord) {
        throw new Error('Failed to create conversion record');
      }

      setConversionId(conversionRecord.id);

      console.log('No cached version found, starting new conversion');
      
      // Optimización en el cálculo de timestamps
      let wordCount = 0;
      const chaptersWithTimestamps = chapters.map(chapter => {
        const currentText = extractedText.substring(0, chapter.startIndex);
        wordCount = currentText.split(/\s+/).length;
        return {
          ...chapter,
          timestamp: Math.floor(wordCount / 150)
        };
      });

      // Reintentos automáticos para convertToAudio
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

      if (detectChapters && chapters.length > 0) {
        const chapterInserts: DatabaseChapter[] = chaptersWithTimestamps.map(chapter => ({
          conversion_id: id,
          title: chapter.title,
          start_index: chapter.startIndex,
          timestamp: chapter.timestamp
        }));

        const chaptersResponse = await retryOperation<PostgrestResponse<DatabaseChapter>>(async () => {
          const response = await supabase.from('chapters').insert(chapterInserts);
          return response;
        }, { maxRetries: 3 });

        if (chaptersResponse.error) {
          console.error('❌ Error storing chapters:', chaptersResponse.error);
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
      .replace(/[<>:"/\\|?*]+/g, '') // Remueve caracteres no válidos
      .replace(/\s+/g, '_') // Reemplaza espacios por guiones bajos
      .substring(0, 255); // Limita la longitud del nombre
    
    const baseName = sanitizedFileName.substring(0, sanitizedFileName.lastIndexOf('.') || sanitizedFileName.length);
    link.download = `${baseName}.mp3`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return {
    handleConversion,
    handleDownload,
    resetConversion
  };
};
