import { extractPdfText } from './pdfUtils';
import { extractEpubText } from './epubUtils';

export type Chapter = {
  title: string;
  startIndex: number;
  timestamp?: number; // Time in minutes where the chapter starts in the audio
  metadata?: {
    language?: string;
  };
};

export type FileProcessingResult = {
  text: string;
  metadata?: {
    totalCharacters: number;
    processedPages?: number;
    language?: string;
    chapters?: Chapter[];
  };
};

const LANGUAGE_PATTERNS = {
  english: /\b(the|and|is|in|to|of)\b/gi,
  spanish: /\b(el|la|los|las|en|de|y|que|es)\b/gi,
  french: /\b(le|la|les|dans|et|de)\b/gi,
  german: /\b(der|die|das|und|in|zu)\b/gi,
} as const;

const detectLanguage = (text: string): string => {
  const sampleText = text.slice(0, 2000); // Increased sample size for better detection
  
  const scores = Object.entries(LANGUAGE_PATTERNS).map(([language, pattern]) => {
    const matches = sampleText.match(pattern) || [];
    // Count unique matches to avoid bias from repeated words
    const uniqueMatches = new Set(matches.map(m => m.toLowerCase()));
    return {
      language,
      score: uniqueMatches.size
    };
  });

  const result = scores.reduce((max, current) => 
    current.score > max.score ? current : max
  , { language: 'english', score: 0 });

  console.log('Language detection scores:', scores);
  console.log('Detected language:', result.language);
  
  return result.language;
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

    console.log('Detected chapters:', chapters); // Debug log

    return {
      text,
      metadata: {
        totalCharacters: text.length,
        language: detectLanguage(text),
        chapters: chapters || []
      }
    };
  } catch (error) {
    console.error(`Error processing ${fileExtension} file:`, error);
    throw error;
  }
};
