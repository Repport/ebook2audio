
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { validateFile } from '@/utils/fileUtils';
import { processFile } from '@/utils/textExtraction';
import FileInfo from './FileInfo';
import DropZone from './DropZone';

interface FileUploadZoneProps {
  onFileSelect: (file: File | null) => void;
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
      toast({
        title: "Processing File",
        description: `Extracting text from ${file.name}...`,
      });
      
      const result = await processFile(file);
      
      if (!result.text.trim()) {
        throw new Error('No text could be extracted from the file');
      }

      const textFile = new File([result.text], file.name.replace(/\.(pdf|epub)$/, '.txt'), {
        type: 'text/plain',
      });

      onFileSelect(textFile);
      
      const fileType = file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB';
      const languageDisplay = result.metadata?.language 
        ? result.metadata.language.charAt(0).toUpperCase() + result.metadata.language.slice(1)
        : 'Unknown';
      
      toast({
        title: "File Processed",
        description: `${fileType} processed (${languageDisplay}). ${result.metadata?.totalCharacters} characters extracted.`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      
      // Only show error toast if we actually failed to process the file
      if (!error.message.includes('language')) {
        toast({
          title: "Error",
          description: "Failed to process file. Please try a different file.",
          variant: "destructive",
        });
      }
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
    }
  }, [onFileSelect, toast]);

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    toast({
      title: "File removed",
      description: "You can now upload a new file",
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
