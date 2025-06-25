
import { useCallback, useRef } from 'react';
import { Chapter } from '@/utils/textExtraction';
import { TextChunkCallback } from '@/services/conversion/types/chunks';
import { useAudioState } from './audio-conversion/useAudioState';
import { useConversionStorage } from './audio-conversion/useConversionStorage';
import { useConversionActions } from './audio-conversion/useConversionActions';
import {
  UseAudioConversionReturn,
  ConversionServiceResult,
  ConversionOptions
} from '../types/hooks/conversion';

export const useAudioConversion = (): UseAudioConversionReturn => {
  // Use a ref to track if the component is mounted
  const mountedRef = useRef(true);
  
  // Use our specialized hooks
  const audioState = useAudioState();
  
  // No longer passing arguments to useConversionStorage
  const { clearConversionStorage } = useConversionStorage();
  
  // Create safe state updater functions
  const safeSetConversionStatus = useCallback((status) => {
    if (mountedRef.current) {
      console.log(`Setting conversion status: ${status}`);
      audioState.setConversionStatus(status);
    }
  }, [audioState]);
  
  const safeSetProgress = useCallback((progress) => {
    if (mountedRef.current) {
      console.log(`Setting conversion progress: ${progress}%`);
      audioState.setProgress(progress);
    }
  }, [audioState]);
  
  const safeSetAudioData = useCallback((data) => {
    if (mountedRef.current) {
      console.log(`Setting audio data: ${data ? 'received' : 'null'}`);
      audioState.setAudioData(data);
    }
  }, [audioState]);
  
  const safeSetAudioDuration = useCallback((duration) => {
    if (mountedRef.current) {
      console.log(`Setting audio duration: ${duration}s`);
      audioState.setAudioDuration(duration);
    }
  }, [audioState]);
  
  const safeSetConversionId = useCallback((id) => {
    if (mountedRef.current) {
      console.log(`Setting conversion ID: ${id}`);
      audioState.setConversionId(id);
    }
  }, [audioState]);
  
  const safeSetCurrentFileName = useCallback((fileName) => {
    if (mountedRef.current) {
      console.log(`Setting current file name: ${fileName}`);
      audioState.setCurrentFileName(fileName);
    }
  }, [audioState]);
  
  const safeSetElapsedTime = useCallback((time) => {
    if (mountedRef.current) {
      audioState.setElapsedTime(time);
    }
  }, [audioState]);
  
  const safeSetConversionStartTime = useCallback((time) => {
    if (mountedRef.current) {
      audioState.setConversionStartTime(time);
    }
  }, [audioState]);
  
  // Get conversion actions with improved error handling
  const { resetConversion, handleConversion, handleDownload } = useConversionActions(
    safeSetConversionStatus,
    safeSetProgress,
    safeSetAudioData,
    safeSetAudioDuration,
    safeSetConversionId,
    safeSetCurrentFileName,
    safeSetElapsedTime,
    safeSetConversionStartTime,
    clearConversionStorage
  );

  // Wrap handleDownload to include audioData from state
  const handleDownloadWithAudioData = useCallback((fileName: string) => {
    if (!audioState.audioData) {
      console.error('Error: No audio data available for download');
      return;
    }
    handleDownload(fileName, audioState.audioData);
  }, [handleDownload, audioState.audioData]);

  return {
    isConverting: audioState.conversionStatus === 'converting',
    conversionProgress: audioState.progress,
    convertedFileUrl: null,
    error: audioState.conversionStatus === 'error' ? (audioState.currentFileName ? `Error converting ${audioState.currentFileName}` : 'Conversion error') : null,
    conversionStatus: audioState.conversionStatus,
    progress: audioState.progress,
    audioData: audioState.audioData,
    audioDuration: audioState.audioDuration,
    conversionId: audioState.conversionId,
    elapsedTime: audioState.elapsedTime,
    
    startConversion: async (file: File, options: ConversionOptions): Promise<ConversionServiceResult> => {
      console.warn('startConversion (file-based) is not fully implemented for TTS context, using placeholder.');
      if (!file || !options.selectedVoice) {
          audioState.setConversionStatus('error');
          return { success: false, message: "File and selected voice are required for file-based conversion." };
      }
      audioState.setConversionStatus('converting');
      audioState.setCurrentFileName(file.name);
      audioState.setProgress(0);
      try {
        const textContent = `Simulated text content from ${file.name}`;
        const result = await handleConversion(textContent, options.selectedVoice, undefined, undefined, file.name);
        if (result.audio) {
          audioState.setAudioData(result.audio);
          audioState.setConversionStatus('completed');
          audioState.setProgress(100);
          return { success: true, message: "File conversion placeholder successful.", data: result };
        } else {
          audioState.setConversionStatus('error');
          return { success: false, message: result.error || `Failed to convert ${file.name}` };
        }
      } catch (e: any) {
        audioState.setConversionStatus('error');
        return { success: false, message: e.message || `Unknown error during ${file.name} conversion.` };
      }
    },

    executeTTSConversion: async (
      text: string,
      voiceId: string,
      chapters?: Chapter[],
      fileName?: string,
      onProgress?: TextChunkCallback
    ) => {
      return handleConversion(text, voiceId, onProgress, chapters, fileName);
    },

    handleConversion: async (
      text: string,
      voiceId: string,
      onProgress?: TextChunkCallback,
      chapters?: Chapter[],
      fileName?: string
    ) => {
      return handleConversion(text, voiceId, onProgress, chapters, fileName);
    },

    handleDownload: handleDownloadWithAudioData,
    resetConversion: () => {
      resetConversion();
      if (mountedRef.current) {
        audioState.setConversionStatus('idle');
        audioState.setProgress(0);
      }
      console.log('cancelConversion called');
    },
    setProgress: safeSetProgress,
    setConversionStatus: safeSetConversionStatus,

    cancelConversion: () => {
      resetConversion();
      if (mountedRef.current) {
        audioState.setConversionStatus('idle');
        audioState.setProgress(0);
      }
      console.log('cancelConversion called');
    },
    
    convertedChapters: audioState.audioData ? [] : undefined,
  };
};
