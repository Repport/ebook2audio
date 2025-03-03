
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useConversionStore } from '@/store/conversionStore';

export function useDownloadHandling() {
  const { toast } = useToast();
  const conversionStore = useConversionStore();
  
  const handleDownload = useCallback((
    audioConversion: any,
    selectedFile: File | null
  ) => {
    console.log('useDownloadHandling - handleDownload called');
    
    // Use audioData from global store if available, otherwise use from audioConversion
    const audioData = conversionStore.audioData || audioConversion.audioData;
    
    if (!audioData) {
      console.log('useDownloadHandling - No audio data available for download');
      
      toast({
        title: "Error",
        description: "No audio data available for download",
        variant: "destructive",
      });
      
      return;
    }

    console.log('useDownloadHandling - Starting download');
    try {
      // Determine file name
      const fileName = conversionStore.fileName || selectedFile?.name || "converted_audio";
      
      audioConversion.handleDownload(fileName);
      
      toast({
        title: "Download started",
        description: "Your audio file is being downloaded",
        variant: "success",
      });
    } catch (error) {
      console.error('useDownloadHandling - Download error:', error);
      
      toast({
        title: "Download error",
        description: "Failed to download the audio file",
        variant: "destructive",
      });
    }
  }, [conversionStore, toast]);
  
  return {
    handleDownload
  };
}
