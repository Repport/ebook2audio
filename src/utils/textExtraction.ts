
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

export const processFile = async (file: File): Promise<FileProcessingResult> => {
  const fileType = file.name.toLowerCase().split('.').pop();
  
  try {
    let text = '';
    let chapters: Chapter[] = [];
    
    switch (fileType) {
      case 'pdf':
        const pdfResult = await extractPdfText(file);
        text = pdfResult.text;
        chapters = pdfResult.chapters;
        break;
      case 'epub':
        const epubResult = await extractEpubText(file);
        text = epubResult.text;
        chapters = epubResult.chapters;
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    const language = detectLanguage(text);

    return {
      text,
      metadata: {
        totalCharacters: text.length,
        language,
        chapters
      }
    };
  } catch (error) {
    console.error(`Error processing ${fileType} file:`, error);
    throw error;
  }
};

function detectLanguage(text: string): string {
  // Sample of common words/patterns for different languages
  const patterns = {
    english: /\b(the|and|is|in|to|of)\b/gi,
    spanish: /\b(el|la|los|las|en|de|y)\b/gi,
    french: /\b(le|la|les|dans|et|de)\b/gi,
    german: /\b(der|die|das|und|in|zu)\b/gi,
  };

  const sampleText = text.slice(0, 1000); // Use first 1000 characters for detection
  
  const scores = Object.entries(patterns).map(([language, pattern]) => {
    const matches = (sampleText.match(pattern) || []).length;
    return { language, score: matches };
  });

  const result = scores.reduce((max, current) => 
    current.score > max.score ? current : max
  , { language: 'english', score: 0 }); // Default to English if no clear match

  // Always return a language, even if confidence is low
  return result.language;
}

