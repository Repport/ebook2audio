
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Chapter } from '@/utils/textExtraction';

interface FileInfo {
  file: File;
  text: string;
  language?: string;
  chapters?: Chapter[];
}

export const useFileProcessing = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const { toast } = useToast();

  const handleFileSelect = async (fileInfo: FileInfo | null) => {
    if (!fileInfo) {
      setSelectedFile(null);
      setExtractedText('');
      setChapters([]);
      return;
    }

    setSelectedFile(fileInfo.file);
    setExtractedText(fileInfo.text);
    setChapters(fileInfo.chapters || []);

    if (fileInfo.chapters?.length) {
      toast({
        title: "Chapters detected",
        description: `Found ${fileInfo.chapters.length} chapters in your document`,
      });
    }
  };

  return {
    selectedFile,
    extractedText,
    chapters,
    handleFileSelect,
  };
};
