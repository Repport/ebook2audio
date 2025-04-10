
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage.tsx';

interface FileInfoProps {
  file: File;
  metadata?: {
    totalCharacters?: number;
    processedPages?: number;
  };
  onRemove: () => void;
  onNext?: () => void;
}

const FileInfo: React.FC<FileInfoProps> = ({ file, onRemove, onNext, metadata }) => {
  const { translations } = useLanguage();
  
  if (!file) return null;

  return (
    <div className="animate-fade-up">
      <h2 className="text-xl font-medium mb-4">
        {translations.fileInformation || "File Information"}
      </h2>
      
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center border-b pb-3">
            <span className="text-sm font-medium text-gray-500">
              {translations.fileName || "File name"}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {file.name}
            </span>
          </div>
          
          <div className="flex justify-between items-center border-b pb-3">
            <span className="text-sm font-medium text-gray-500">
              {translations.fileType || "File type"}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {file.type || "Unknown"}
            </span>
          </div>
          
          <div className="flex justify-between items-center border-b pb-3">
            <span className="text-sm font-medium text-gray-500">
              {translations.fileSize || "File size"}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          
          {metadata?.totalCharacters !== undefined && (
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-sm font-medium text-gray-500">
                {translations.totalCharacters || "Total characters"}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {metadata.totalCharacters.toLocaleString()}
              </span>
            </div>
          )}
          
          {metadata?.processedPages !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">
                {translations.pages || "Pages"}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {metadata.processedPages}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button
          variant="outline" 
          onClick={onRemove}
          className="flex items-center gap-2"
        >
          {translations.removeFile || "Remove file"}
        </Button>
        
        {onNext && (
          <Button
            onClick={onNext}
            className="flex items-center gap-2"
          >
            {translations.continue || "Continue"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FileInfo;
