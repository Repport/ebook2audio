
import { useCallback, useRef } from 'react';
import { Chapter } from '@/utils/textExtraction';
// TextChunkCallback might not be directly used by the new return type, but keeping for now
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
  
  // Add cleanup function to handle component unmounting
  const cleanup = useCallback(() => {
    console.log('Cleaning up audio conversion resources');
    mountedRef.current = false;
  }, []);

  const debugState = useCallback(() => {
    console.log('Current audio conversion state:', {
      status: audioState.conversionStatus,
      progress: audioState.progress,
      hasAudioData: !!audioState.audioData,
      audioDuration: audioState.audioDuration,
      elapsedTime: audioState.elapsedTime,
      conversionId: audioState.conversionId
    });
  }, [audioState]);

  // TODO: Refactor this hook to actually implement UseAudioConversionReturn
  // This hook now aims to more closely implement UseAudioConversionReturn
  // using the states and actions available from its constituent hooks.

  return {
    isConverting: audioState.conversionStatus === 'converting',
    conversionProgress: audioState.progress,
    convertedFileUrl: null, // Remains null as handleConversion provides ArrayBuffer, not URL
    error: audioState.conversionStatus === 'error' ? (audioState.currentFileName ? `Error converting ${audioState.currentFileName}` : 'Conversion error') : null, // Uses currentFileName if available for error
    
    startConversion: async (file: File, options: ConversionOptions): Promise<ConversionServiceResult> => {
      // This is still a placeholder or would need significant refactor.
      // For TTS, executeTTSConversion is the primary method.
      console.warn('startConversion (file-based) is not fully implemented for TTS context, using placeholder.');
      if (!file || !options.selectedVoice) { // Added selectedVoice check from options
          audioState.setConversionStatus('error');
          return { success: false, message: "File and selected voice are required for file-based conversion." };
      }
      audioState.setConversionStatus('converting');
      audioState.setCurrentFileName(file.name);
      audioState.setProgress(0);
      try {
        // Simulate reading file and then calling TTS.
        // This is highly simplified. A real implementation would read file content.
        const textContent = `Simulated text content from ${file.name}`;
        const result = await handleConversion(textContent, options.selectedVoice, undefined, undefined, file.name);
        if (result.audio) {
          audioState.setAudioData(result.audio); // Save audio data to state
          audioState.setConversionStatus('completed');
          audioState.setProgress(100);
          // TODO: Populate convertedChapters if necessary
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
      onProgress?: TextChunkCallback // Using actual TextChunkCallback from useConversionActions
                                     // instead of TextChunkCallbackPlaceholder for implementation
    ) => {
      // Directly use `handleConversion` from `useConversionActions`
      // `handleConversion` already sets status, progress, audioData via callbacks
      return handleConversion(text, voiceId, onProgress, chapters, fileName);
    },

    cancelConversion: () => {
      resetConversion(); // This comes from useConversionActions and resets its internal state via callbacks
      // Additionally ensure local audioState reflects cancellation if not already covered by resetConversion's effects
      if (mountedRef.current) {
        audioState.setConversionStatus('idle');
        audioState.setProgress(0);
        // audioState.setAudioData(null); // resetConversion should handle this via safeSetAudioData
        // audioState.setCurrentFileName(null); // resetConversion should handle this
      }
      console.log('cancelConversion called');
    },
    
    convertedChapters: audioState.audioData ? [] : undefined, // Placeholder, depends on actual chapter logic
    // If chapters are generated and stored in audioState, reflect it here.
    // For now, returns empty array if audioData exists, else undefined.
  };
};
