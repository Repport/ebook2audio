
import React, { useState } from 'react';
import FileUploadZone from '@/components/FileUploadZone';
import Header from '@/components/Header';
import FileProcessor from '@/components/FileProcessor';
import { useToast } from '@/hooks/use-toast';
import { Chapter } from '@/utils/textExtraction';
import { LanguageProvider } from '@/hooks/useLanguage';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const { toast } = useToast();

  const handleFileSelect = async (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => {
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

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Header />

          <div className="space-y-8">
            <FileUploadZone onFileSelect={handleFileSelect} />

            {selectedFile && (
              <FileProcessor
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                extractedText={extractedText}
                chapters={chapters}
              />
            )}
          </div>
        </div>
      </div>
    </LanguageProvider>
  );
};

export default Index;
