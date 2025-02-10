
import { useState, useEffect } from 'react';
import { loadConversionState, saveConversionState, convertArrayBufferToBase64, convertBase64ToArrayBuffer, clearConversionStorage } from '@/services/storage/conversionStorageService';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type TextConversion = Database['public']['Tables']['text_conversions']['Row'];

export const useConversionState = () => {
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [conversionId, setConversionId] = useState<string | null>(null);
  const [estimatedSeconds, setEstimatedSeconds] = useState<number>(0);

  // Load stored state and subscribe to real-time updates on mount
  useEffect(() => {
    const storedState = loadConversionState();
    if (storedState) {
      console.log('Loaded stored conversion state:', storedState);
      setConversionStatus(storedState.status);
      setProgress(Math.min(storedState.progress, 100));
      setCurrentFileName(storedState.fileName || null);
      if (storedState.audioData) {
        try {
          const audio = convertBase64ToArrayBuffer(storedState.audioData);
          setAudioData(audio);
          setAudioDuration(storedState.audioDuration || 0);
        } catch (error) {
          console.error('Error loading stored audio data:', error);
          clearConversionStorage();
        }
      }
    }

    // Subscribe to real-time updates for the conversion status
    const channel = supabase.channel('conversions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'text_conversions'
        },
        async (payload: RealtimePostgresChangesPayload<TextConversion>) => {
          console.log('Received conversion update:', payload);
          const conversion = payload.new as TextConversion;

          // Update status and progress
          if (conversion && 'status' in conversion) {
            setConversionStatus(conversion.status as 'idle' | 'converting' | 'completed' | 'error');
          }

          if (conversion && 'progress' in conversion && typeof conversion.progress === 'number') {
            setProgress(Math.min(conversion.progress, 100));
          }

          // Update filename
          if (conversion && 'file_name' in conversion) {
            setCurrentFileName(conversion.file_name);
          }

          // Update estimated seconds
          if (conversion && 'estimated_seconds' in conversion && typeof conversion.estimated_seconds === 'number') {
            setEstimatedSeconds(conversion.estimated_seconds);
          }

          // Handle storage path and audio data
          if (conversion && 'storage_path' in conversion && conversion.storage_path) {
            try {
              const { data, error } = await supabase.storage
                .from('audio_cache')
                .download(conversion.storage_path);
              
              if (error) throw error;
              
              const arrayBuffer = await data.arrayBuffer();
              setAudioData(arrayBuffer);
              
              if ('duration' in conversion) {
                setAudioDuration(conversion.duration || 0);
              }
            } catch (error) {
              console.error('Error fetching audio data:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Save state changes to local storage
  useEffect(() => {
    if (conversionStatus === 'idle') {
      clearConversionStorage();
      return;
    }
    
    try {
      console.log('Saving conversion state:', {
        status: conversionStatus,
        progress: Math.min(progress, 100),
        fileName: currentFileName,
        hasAudioData: !!audioData
      });

      saveConversionState({
        status: conversionStatus,
        progress: Math.min(progress, 100),
        audioDuration,
        fileName: currentFileName || undefined,
        audioData: audioData ? convertArrayBufferToBase64(audioData) : undefined
      });
    } catch (error) {
      console.error('Error saving conversion state:', error);
    }
  }, [conversionStatus, progress, audioData, audioDuration, currentFileName]);

  return {
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    currentFileName,
    conversionId,
    estimatedSeconds,
    setConversionStatus,
    setProgress,
    setAudioData,
    setAudioDuration,
    setCurrentFileName,
    setConversionId,
    setEstimatedSeconds
  };
};
