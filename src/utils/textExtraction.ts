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
  timestamp?: number; // Time in minutes where the chapter starts in the audio
};

const LANGUAGE_PATTERNS = {
  english: /\b(the|and|is|in|to|of)\b/gi,
  spanish: /\b(el|la|los|las|en|de|y)\b/gi,
  french: /\b(le|la|les|dans|et|de)\b/gi,
  german: /\b(der|die|das|und|in|zu)\b/gi,
} as const;

const detectLanguage = (text: string): string => {
  const sampleText = text.slice(0, 1000);
  
  const scores = Object.entries(LANGUAGE_PATTERNS).map(([language, pattern]) => ({
    language,
    score: (sampleText.match(pattern) || []).length
  }));

  return scores.reduce((max, current) => 
    current.score > max.score ? current : max
  , { language: 'english', score: 0 }).language;
};

export const processFile = async (file: File): Promise<FileProcessingResult> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (!fileExtension) {
    throw new Error('Unable to determine file type');
  }

  if (!['pdf', 'epub'].includes(fileExtension)) {
    throw new Error(`Unsupported file type: ${fileExtension}`);
  }

  try {
    const { text, chapters } = fileExtension === 'pdf' 
      ? await extractPdfText(file)
      : await extractEpubText(file);

    return {
      text,
      metadata: {
        totalCharacters: text.length,
        language: detectLanguage(text),
        chapters
      }
    };
  } catch (error) {
    console.error(`Error processing ${fileExtension} file:`, error);
    throw error;
  }
};
