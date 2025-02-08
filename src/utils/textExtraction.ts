
import { extractPdfText } from './pdfUtils';
import { extractEpubText } from './epubUtils';

export type FileProcessingResult = {
  text: string;
  metadata?: {
    totalCharacters: number;
    processedPages?: number;
    language?: string;
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

    // Simple language detection based on common words and characters
    const language = detectLanguage(text);

    return {
      text,
      metadata: {
        totalCharacters: text.length,
        language
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
  , { language: 'unknown', score: 0 });

  // Only return a language if we have a reasonable confidence
  return result.score > 3 ? result.language : 'unknown';
}

