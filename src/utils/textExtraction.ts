
import { extractPdfText } from './pdfUtils';
import { extractEpubText } from './epubUtils';

export type FileProcessingResult = {
  text: string;
  metadata?: {
    totalCharacters: number;
    processedPages?: number;
  };
};

export const processFile = async (file: File): Promise<FileProcessingResult> => {
  const fileType = file.name.toLowerCase().split('.').pop();
  
  try {
    let text = '';
    
    switch (fileType) {
      case 'pdf':
        text = await extractPdfText(file);
        break;
      case 'epub':
        text = await extractEpubText(file);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    return {
      text,
      metadata: {
        totalCharacters: text.length,
      }
    };
  } catch (error) {
    console.error(`Error processing ${fileType} file:`, error);
    throw error;
  }
};
