
import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { convertTextToSpeech } from '@/services/textToSpeechService';
import { ConversionState, ConversionProgress } from '@/types/conversion';

export function useTextToSpeech() {
  const { toast } = useToast();
  const [state, setState] = useState<ConversionState>({
    status: 'idle',
    progress: 0,
    audioData: null,
    error: null,
    fileName: null
  });
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Reset the timer when status changes
  useEffect(() => {
    if (state.status === 'converting') {
      // Start the timer
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedTime(elapsed);
          
          // Estimate remaining time based on progress
          if (state.progress > 5) {
            const totalEstimatedTime = (elapsed / state.progress) * 100;
            const remaining = Math.max(0, Math.floor(totalEstimatedTime - elapsed));
            setEstimatedTimeRemaining(remaining);
          }
        }
      }, 1000);
    } else if (timerRef.current) {
      // Stop the timer
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [state.status, state.progress]);
  
  const handleProgress = useCallback((progress: ConversionProgress) => {
    setState(prevState => ({
      ...prevState,
      progress: progress.progress,
      error: progress.error || prevState.error
    }));
  }, []);
  
  const convertText = useCallback(async (text: string, voiceId: string, fileName?: string) => {
    if (!text || !voiceId) {
      toast({
        title: "Error",
        description: "Text and voice are required for conversion",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Reset state
      setState({
        status: 'converting',
        progress: 0,
        audioData: null,
        error: null,
        fileName: fileName || null
      });
      
      // Reset timer values
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      setEstimatedTimeRemaining(null);
      
      // Start conversion
      const result = await convertTextToSpeech(text, voiceId, handleProgress);
      
      // Update state with the result
      setState({
        status: 'completed',
        progress: 100,
        audioData: result.audio,
        error: null,
        fileName: fileName || null
      });
      
      return result;
    } catch (error) {
      console.error('Conversion error:', error);
      
      setState({
        status: 'error',
        progress: 0,
        audioData: null,
        error: error instanceof Error ? error.message : String(error),
        fileName: fileName || null
      });
      
      toast({
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      
      return null;
    }
  }, [toast, handleProgress]);
  
  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setState({
      status: 'idle',
      progress: 0,
      audioData: null,
      error: null,
      fileName: null
    });
    
    setElapsedTime(0);
    setEstimatedTimeRemaining(null);
  }, []);
  
  const downloadAudio = useCallback(() => {
    if (!state.audioData) {
      toast({
        title: "Error",
        description: "No audio data available for download",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const blob = new Blob([state.audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.fileName || 'audio'}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  }, [state.audioData, state.fileName, toast]);
  
  return {
    status: state.status,
    progress: state.progress,
    audioData: state.audioData,
    error: state.error,
    fileName: state.fileName,
    elapsedTime,
    estimatedTimeRemaining,
    convertText,
    reset,
    downloadAudio
  };
}
