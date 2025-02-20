
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { validateFile } from '@/utils/fileUtils';
import { processFile } from '@/utils/textExtraction';
import { checkCache } from '@/services/conversion/cacheService';
import { generateHash } from '@/services/conversion/utils';
import FileInfo from './FileInfo';
import DropZone from './DropZone';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

interface FileUploadZoneProps {
  onFileSelect: (fileInfo: { file: File, text: string, language?: string } | null) => void;
}

const FileUploadZone = ({ onFileSelect }: FileUploadZoneProps) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedText, setProcessedText] = useState<string>('');
  const [processedLanguage, setProcessedLanguage] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
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

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setProcessedText('');
    setProcessedLanguage(undefined);
    onFileSelect(null);
  };

  const handleContinue = () => {
    if (!selectedFile || !processedText) {
      toast({
        title: "Error",
        description: "Please upload a valid file first",
        variant: "destructive",
      });
      return;
    }
    onFileSelect({
      file: selectedFile,
      text: processedText,
      language: processedLanguage
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/epub+zip': ['.epub'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  if (selectedFile) {
    return (
      <div className="space-y-4">
        <FileInfo file={selectedFile} onRemove={handleRemoveFile} />
        <div className="flex justify-end mt-4">
          <Button 
            onClick={handleContinue}
            className="flex items-center gap-2"
            disabled={isProcessing}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DropZone
      getRootProps={getRootProps}
      getInputProps={getInputProps}
      isDragActive={isDragActive}
    />
  );
};

export default FileUploadZone;
