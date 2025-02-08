
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { validateFile } from '@/utils/fileUtils';
import { extractPdfText } from '@/utils/pdfUtils';
import { extractEpubText } from '@/utils/epubUtils';
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
      let text = '';
      if (file.name.toLowerCase().endsWith('.pdf')) {
        toast({
          title: "Processing PDF",
          description: "Extracting text from PDF...",
        });
        text = await extractPdfText(file);
      } else if (file.name.toLowerCase().endsWith('.epub')) {
        toast({
          title: "Processing EPUB",
          description: "Extracting text from EPUB...",
        });
        text = await extractEpubText(file);
      }

      if (!text.trim()) {
        throw new Error('No text could be extracted from the file');
      }

      const textFile = new File([text], file.name.replace(/\.(pdf|epub)$/, '.txt'), {
        type: 'text/plain',
      });

      onFileSelect(textFile);
      toast({
        title: "File Processed",
        description: `Successfully extracted ${text.length} characters from file`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process the file. Please try again.",
        variant: "destructive",
      });
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
