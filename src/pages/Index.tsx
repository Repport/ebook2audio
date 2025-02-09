
import React from 'react';
import FileUploadZone from '@/components/FileUploadZone';
import Header from '@/components/Header';
import FileProcessor from '@/components/FileProcessor';
import { useFileProcessing } from '@/hooks/useFileProcessing';

const Index = () => {
  const {
    selectedFile,
    extractedText,
    chapters,
    handleFileSelect,
  } = useFileProcessing();

  return (
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
  );
};

export default Index;
