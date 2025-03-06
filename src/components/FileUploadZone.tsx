
import React, { useEffect, memo, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Chapter } from '@/utils/textExtraction';
import { useFileUpload } from '@/hooks/useFileUpload';
import DropZone from './DropZone';
import SelectedFileView from './file-upload/SelectedFileView';

interface FileUploadZoneProps {
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => void;
}

const FileUploadZone = memo(({ onFileSelect }: FileUploadZoneProps) => {
  const {
    selectedFile,
    processedText,
    processedLanguage,
    processedChapters,
    isProcessing,
    fileMetadata,
    handleFileDrop,
    handleRemoveFile,
    handleContinue
  } = useFileUpload(onFileSelect);

  // Only log on mount and when dependencies actually change
  useEffect(() => {
    console.log('FileUploadZone rendered with:', {
      hasFile: !!selectedFile,
      textLength: processedText?.length || 0,
      language: processedLanguage,
      chaptersCount: processedChapters?.length || 0
    });
  }, [
    selectedFile ? selectedFile.name : null, 
    processedText?.length, 
    processedLanguage, 
    processedChapters?.length
  ]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'application/epub+zip': ['.epub'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  if (selectedFile) {
    return (
      <SelectedFileView
        file={selectedFile}
        isProcessing={isProcessing}
        metadata={fileMetadata}
        onRemove={handleRemoveFile}
        onContinue={handleContinue}
      />
    );
  }

  return (
    <DropZone
      getRootProps={getRootProps}
      getInputProps={getInputProps}
      isDragActive={isDragActive}
    />
  );
});

// Add displayName for debugging
FileUploadZone.displayName = 'FileUploadZone';

export default FileUploadZone;
