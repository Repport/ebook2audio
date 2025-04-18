
import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateFile } from '@/utils/fileUtils';
import { processFile, Chapter } from '@/utils/textExtraction';
import { checkCache } from '@/services/conversion/cacheService';
import { generateHash } from '@/services/conversion/utils';

interface FileMetadata {
  totalCharacters?: number;
  processedPages?: number;
}

interface UseFileUploadReturn {
  selectedFile: File | null;
  processedText: string;
  processedLanguage: string | undefined;
  processedChapters: Chapter[];
  isProcessing: boolean;
  fileMetadata: FileMetadata;
  handleFileDrop: (acceptedFiles: File[]) => Promise<void>;
  handleRemoveFile: () => void;
  handleContinue: () => void;
}

export function useFileUpload(
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => void
): UseFileUploadReturn {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedText, setProcessedText] = useState<string>('');
  const [processedLanguage, setProcessedLanguage] = useState<string | undefined>();
  const [processedChapters, setProcessedChapters] = useState<Chapter[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata>({});

  const handleFileDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0] || null;
    
    if (!file) {
      toast({
        title: "Error",
        description: "No file was received",
        variant: "destructive",
      });
      return;
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension) {
      toast({
        title: "Invalid File",
        description: "Unable to determine file type. Please ensure your file has a valid extension.",
        variant: "destructive",
      });
      return;
    }

    if (!['pdf', 'epub'].includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: `File type .${fileExtension} is not supported. Please upload a PDF or EPUB file.`,
        variant: "destructive",
      });
      return;
    }

    const validation = validateFile(file);
    if (!validation.isValid && validation.error) {
      toast({
        title: validation.error.title,
        description: validation.error.description,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      console.log('Processing file:', file.name);
      const result = await processFile(file);
      
      if (!result.text.trim()) {
        throw new Error('No text could be extracted from the file');
      }

      // Generate hash of the extracted text
      const textHash = await generateHash(result.text, file.name);
      console.log('Generated text hash:', textHash);

      // Check cache for existing conversion
      const { storagePath, error: cacheError } = await checkCache(textHash);
      
      if (cacheError) {
        console.error('Cache check error:', cacheError);
      } else if (storagePath) {
        console.log('Found cached conversion:', storagePath);
        toast({
          title: "Cache found",
          description: "This document has been converted before. The cached version will be used.",
        });
      } else {
        console.log('No cached version found');
      }

      setProcessedText(result.text);
      setProcessedLanguage(result.metadata?.language);
      
      // Save chapters if available
      if (result.metadata?.chapters) {
        setProcessedChapters(result.metadata.chapters);
        console.log('Chapters detected:', result.metadata.chapters.length);
      }
      
      // Save metadata for display
      if (result.metadata) {
        setFileMetadata({
          totalCharacters: result.metadata.totalCharacters,
          processedPages: result.metadata.processedPages
        });
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      
      if (error.message === 'No text could be extracted from the file') {
        setSelectedFile(null);
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to process file. Please try a different file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setProcessedText('');
    setProcessedLanguage(undefined);
    setProcessedChapters([]);
    setFileMetadata({});
    onFileSelect(null);
  }, [onFileSelect]);

  const handleContinue = useCallback(() => {
    if (!selectedFile || !processedText) {
      toast({
        title: "Error",
        description: "Please upload a valid file first",
        variant: "destructive",
      });
      return;
    }
    
    console.log('FileUploadZone - Continue clicked with:', {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      textLength: processedText.length,
      language: processedLanguage,
      chaptersCount: processedChapters.length
    });
    
    onFileSelect({
      file: selectedFile,
      text: processedText,
      language: processedLanguage,
      chapters: processedChapters
    });
  }, [selectedFile, processedText, processedLanguage, processedChapters, toast, onFileSelect]);

  return {
    selectedFile,
    processedText,
    processedLanguage,
    processedChapters,
    isProcessing,
    fileMetadata,
    handleFileDrop,
    handleRemoveFile,
    handleContinue
  };
}
