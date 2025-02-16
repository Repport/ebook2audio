
import { useCallback } from 'react';

interface UseConversionDownloadProps {
  audioData: ArrayBuffer | null;
  currentFileName: string | null;
  toast: any;
}

export const useConversionDownload = ({
  audioData,
  currentFileName,
  toast
}: UseConversionDownloadProps) => {
  return useCallback(async (fileName: string) => {
    if (!audioData) {
      console.error('No audio data available for download');
      toast({
        title: "Error",
        description: "No hay audio disponible para descargar",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting download process for:', fileName);
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const sanitizedFileName = (fileName || currentFileName || 'audio')
        .replace(/[<>:"/\\|?*]+/g, '') 
        .replace(/\s+/g, '_')
        .substring(0, 255);
      
      const baseName = sanitizedFileName.substring(0, sanitizedFileName.lastIndexOf('.') || sanitizedFileName.length);
      link.download = `${baseName}.mp3`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Download completed successfully');
      
      toast({
        title: "Descarga completada",
        description: "El archivo de audio se ha descargado correctamente",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error en la descarga",
        description: "No se pudo descargar el archivo de audio",
        variant: "destructive",
      });
    }
  }, [audioData, currentFileName, toast]);
};
