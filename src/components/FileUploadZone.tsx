import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';

interface FileUploadZoneProps {
  onFileSelect: (file: File | null) => void;
}

const FileUploadZone = ({ onFileSelect }: FileUploadZoneProps) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const validateFile = (file: File | null): boolean => {
    if (!file) {
      toast({
        title: "Invalid file",
        description: "No file was provided",
        variant: "destructive",
      });
      return false;
    }

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const validExtensions = ['epub', 'pdf'];
    
    if (!validExtensions.includes(fileExtension || '')) {
      toast({
        title: "Invalid file",
        description: "Please upload an EPUB or PDF file",
        variant: "destructive",
      });
      return false;
    }

    if (file.size === 0) {
      toast({
        title: "Invalid file",
        description: "The file appears to be empty",
        variant: "destructive",
      });
      return false;
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 100MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0] || null;
    
    if (!file) {
      toast({
        title: "Error",
        description: "No file was received",
        variant: "destructive",
      });
      return;
    }

    console.log('File received:', { name: file.name, size: formatFileSize(file.size) });
    
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
      toast({
        title: "File accepted",
        description: `${file.name} (${formatFileSize(file.size)}) is ready for conversion`,
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
    return (
      <div className="flex justify-center w-full">
        <div className="w-full max-w-xl p-6 border-2 rounded-lg border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full">
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
          <p className="mt-2 text-xs text-gray-400">Maximum file size: 100MB</p>
        </div>
      </div>
    </div>
  );
};

export default FileUploadZone;