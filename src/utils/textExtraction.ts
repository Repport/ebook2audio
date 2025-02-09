
import { extractPdfText } from './pdfUtils';
import { extractEpubText } from './epubUtils';

export type FileProcessingResult = {
  text: string;
  metadata?: {
    totalCharacters: number;
    processedPages?: number;
    language?: string;
    chapters?: Chapter[];
  };
};

export type Chapter = {
  title: string;
  startIndex: number;
};

const LANGUAGE_PATTERNS = {
  english: /\b(the|and|is|in|to|of)\b/gi,
  spanish: /\b(el|la|los|las|en|de|y)\b/gi,
  french: /\b(le|la|les|dans|et|de)\b/gi,
  german: /\b(der|die|das|und|in|zu)\b/gi,
} as const;

const detectLanguage = (text: string): string => {
  const SAMPLE_SIZE = 1000;
  const sampleText = text.slice(0, SAMPLE_SIZE);
  
  const scores = Object.entries(LANGUAGE_PATTERNS).map(([language, pattern]) => ({
    language,
    score: (sampleText.match(pattern) || []).length
  }));

  const { language } = scores.reduce((max, current) => 
    current.score > max.score ? current : max
  , { language: 'english', score: 0 });

  return language;
};

const validateFile = (file: File): void => {
  if (!file) {
    throw new Error('No file provided');
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (!fileExtension || !['pdf', 'epub'].includes(fileExtension)) {
    throw new Error(`Unsupported file type: ${fileExtension}`);
  }
};

export const processFile = async (file: File): Promise<FileProcessingResult> => {
  console.log('Starting file processing:', file.name);
  validateFile(file);

  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  try {
    const { text, chapters } = fileExtension === 'pdf' 
      ? await extractPdfText(file)
      : await extractEpubText(file);

    const language = detectLanguage(text);
    console.log('File processed successfully:', {
      fileType: fileExtension,
      textLength: text.length,
      language,
      chaptersFound: chapters.length
    });

    return {
      text,
      metadata: {
        totalCharacters: text.length,
        language,
        chapters
      }
    };
  } catch (error) {
    console.error(`Error processing ${fileExtension} file:`, error);
    throw error;
  }
};
