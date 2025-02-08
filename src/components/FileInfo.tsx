
import React from 'react';
import { FileText, X } from 'lucide-react';
import { Button } from './ui/button';
import { formatFileSize } from '@/utils/fileUtils';

interface FileInfoProps {
  file: File;
  onRemove: () => void;
}

const FileInfo = ({ file, onRemove }: FileInfoProps) => {
  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-xl p-6 border-2 rounded-lg border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileInfo;
