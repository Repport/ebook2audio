import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
}

const FileUploadZone = ({ onFileSelect }: FileUploadZoneProps) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (fileExtension === 'epub' || fileExtension === 'pdf') {
      setSelectedFile(file);
      onFileSelect(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload an EPUB or PDF file",
        variant: "destructive",
      });
    }
  }, [onFileSelect, toast]);

  const handleRemoveFile = () => {
    setSelectedFile(null);
    // Notify parent component that file was removed
    onFileSelect(null as any);
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
    multiple: false
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
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
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
        </div>
      </div>
    </div>
  );
};

export default FileUploadZone;