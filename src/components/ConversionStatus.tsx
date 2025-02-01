import React from 'react';
import { Loader2 } from 'lucide-react';

interface ConversionStatusProps {
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress?: number;
  fileType?: 'PDF' | 'EPUB';
  chaptersFound?: number;
  detectingChapters?: boolean;
}

const ConversionStatus = ({ 
  status, 
  progress = 0, 
  fileType = 'EPUB',
  chaptersFound = 0,
  detectingChapters = false 
}: ConversionStatusProps) => {
  const statusMessages = {
    idle: 'Ready to convert',
    converting: `Converting your ${fileType} to MP3...`,
    completed: 'Conversion completed!',
    error: 'Conversion failed'
  };

  return (
    <div className="flex flex-col items-center space-y-4 animate-fade-up">
      {status === 'converting' && (
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      )}
      <p className="text-lg font-medium text-gray-900">{statusMessages[status]}</p>
      {detectingChapters && (
        <p className="text-sm text-gray-600">
          Detecting chapters... Found {chaptersFound} chapters
        </p>
      )}
      {status === 'converting' && (
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ConversionStatus;