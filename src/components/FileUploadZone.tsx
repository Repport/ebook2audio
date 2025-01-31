import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
}

const FileUploadZone = ({ onFileSelect }: FileUploadZoneProps) => {
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (fileExtension === 'epub' || fileExtension === 'pdf') {
      onFileSelect(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload an EPUB or PDF file",
        variant: "destructive",
      });
    }
  }, [onFileSelect, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/epub+zip': ['.epub'],
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`w-full max-w-xl p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center">
        <Upload className="w-12 h-12 mb-4 text-gray-400" />
        <p className="mb-2 text-lg font-medium text-gray-900">
          {isDragActive ? 'Drop the file here' : 'Drag & drop your EPUB or PDF file here'}
        </p>
        <p className="text-sm text-gray-500">or click to select a file</p>
      </div>
    </div>
  );
};

export default FileUploadZone;