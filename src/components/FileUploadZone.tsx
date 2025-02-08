
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { validateFile } from '@/utils/fileUtils';
import { extractPdfText } from '@/utils/pdfUtils';
import FileInfo from './FileInfo';
import DropZone from './DropZone';

interface FileUploadZoneProps {
  onFileSelect: (file: File | null) => void;
}

const FileUploadZone = ({ onFileSelect }: FileUploadZoneProps) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

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

    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        toast({
          title: "Processing PDF",
          description: "Extracting text from PDF...",
        });
        
        const text = await extractPdfText(file);
        const textFile = new File([text], file.name.replace('.pdf', '.txt'), {
          type: 'text/plain',
        });
        setSelectedFile(file); // Keep original file for display
        onFileSelect(textFile); // Pass text file for processing
      } else {
        setSelectedFile(file);
        onFileSelect(file);
      }
      
      toast({
        title: "File accepted",
        description: `${file.name} is ready for conversion`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process the file. Please try again.",
        variant: "destructive",
      });
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
