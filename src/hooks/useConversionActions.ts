
import { User } from '@supabase/supabase-js';
import { ExtractedChapter } from '@/types/conversion';
import { useConversionReset } from './conversion/useConversionReset';
import { useConversionDownload } from './conversion/useConversionDownload';
import { useConversionProcess } from './conversion/useConversionProcess';

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
  const resetConversion = useConversionReset({
    setConversionStatus,
    setProgress,
    setAudioData,
    setAudioDuration,
    setCurrentFileName,
    setConversionId
  });

  const handleDownload = useConversionDownload({
    audioData,
    currentFileName,
    toast
  });

  const handleConversion = useConversionProcess({
    user,
    toast,
    setConversionStatus,
    setProgress,
    setAudioData,
    setAudioDuration,
    setCurrentFileName,
    setConversionId
  });

  return {
    handleConversion,
    handleDownload,
    resetConversion
  };
};
