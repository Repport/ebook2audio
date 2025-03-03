
import React from 'react';
import { X, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

interface FileInfoProps {
  file: File;
  metadata?: {
    totalCharacters?: number;
    processedPages?: number;
  };
  onRemove: () => void;
  onNext?: () => void;
}

const FileInfo = ({ file, onRemove, onNext, metadata }: FileInfoProps) => {
  const { translations } = useLanguage();
  
  if (!file) return null;

  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const isEpub = fileExtension === 'epub';

  const fileIconClass = "w-12 h-12 text-primary";
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatNumber = (num?: number): string => {
    if (num === undefined) return "-";
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col items-center text-center mb-6">
        <FileText className={fileIconClass} />
        <h2 className="text-xl font-medium mt-4 text-gray-800 dark:text-gray-200">
          {translations.fileInformation || "File Information"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {translations.fileInformationDesc || "Details about your selected file"}
        </p>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {translations.fileName || "File name"}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[250px] truncate">
              {file.name}
            </span>
          </div>
          
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {translations.fileType || "File type"}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {isEpub ? "EPUB" : "PDF"}
            </span>
          </div>
          
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {translations.fileSize || "File size"}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatFileSize(file.size)}
            </span>
          </div>
          
          {metadata?.totalCharacters !== undefined && (
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {translations.totalCharacters || "Total characters"}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatNumber(metadata.totalCharacters)}
              </span>
            </div>
          )}
          
          {metadata?.processedPages !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {translations.pages || "Pages"}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatNumber(metadata.processedPages)}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button
          variant="outline" 
          onClick={onRemove}
          className="flex items-center gap-2 text-gray-500 hover:text-red-500 border-gray-200 dark:border-gray-700"
        >
          <X className="w-4 h-4" />
          {translations.removeFile || "Remove file"}
        </Button>
        
        {onNext && (
          <Button
            onClick={onNext}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 rounded-full px-6"
          >
            {translations.continue || "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default FileInfo;
