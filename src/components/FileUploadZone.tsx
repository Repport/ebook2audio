
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { validateFile } from '@/utils/fileUtils';
import { processFile } from '@/utils/textExtraction';
import { checkCache } from '@/services/conversion/cacheService';
import { generateHash } from '@/services/conversion/utils';
import FileInfo from './FileInfo';
import DropZone from './DropZone';

interface FileUploadZoneProps {
  onFileSelect: (fileInfo: { file: File, text: string, language?: string } | null) => void;
}

const FileUploadZone = ({ onFileSelect }: FileUploadZoneProps) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

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

      onFileSelect({
        file,
        text: result.text,
        language: result.metadata?.language
      });
      
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
  }, [onFileSelect, toast]);

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
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
    return <FileInfo file={selectedFile} onRemove={handleRemoveFile} />;
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
