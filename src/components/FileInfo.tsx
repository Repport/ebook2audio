
import React from 'react';
import { FileText, X } from 'lucide-react';
import { Button } from './ui/button';
import { formatFileSize } from '@/utils/fileUtils';
import { processFile } from '@/utils/textExtraction';

interface FileInfoProps {
  file: File;
  onRemove: () => void;
  onNext?: () => void; // Hacemos onNext opcional para mantener compatibilidad
}

const FileInfo = ({ file, onRemove, onNext }: FileInfoProps) => {
  const [characterCount, setCharacterCount] = React.useState<number | null>(null);
  const [language, setLanguage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const processFileInfo = async () => {
      try {
        const result = await processFile(file);
        setCharacterCount(result.metadata?.totalCharacters || null);
        setLanguage(result.metadata?.language || null);
      } catch (error) {
        console.error('Error processing file:', error);
      }
    };

    processFileInfo();
  }, [file]);

  const formatLanguage = (lang: string): string => {
    const languages: Record<string, string> = {
      english: 'English',
      spanish: 'Spanish',
      french: 'French',
      german: 'German',
      unknown: 'Unknown'
    };
    return languages[lang] || 'Unknown';
  };

  return (
    <div className="flex flex-col items-center w-full gap-6">
      <div className="w-full max-w-xl p-6 border-2 rounded-lg border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </p>
                {characterCount !== null && (
                  <p className="text-sm text-gray-500">
                    {characterCount.toLocaleString()} characters
                  </p>
                )}
                {language && (
                  <p className="text-sm text-gray-500">
                    Language: {formatLanguage(language)}
                  </p>
                )}
              </div>
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
      
      {onNext && (
        <div className="flex justify-end w-full">
          <Button onClick={onNext}>
            Continuar
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileInfo;
