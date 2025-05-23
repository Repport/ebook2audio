
import { extractPdfText } from './pdfUtils';
import { extractEpubText } from './epubUtils';

export type Chapter = {
  title: string;
  startIndex: number;
  timestamp?: number;
  metadata?: {
    language?: string;
  };
  confidence?: number;
  type?: 'pattern' | 'style' | 'heading';
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
  const sampleText = text.slice(0, 2000);
  
  const scores = Object.entries(LANGUAGE_PATTERNS).map(([language, pattern]) => {
    const matches = sampleText.match(pattern) || [];
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
    let text = '';
    let chapters: Chapter[] = [];
    let pagesCount = 1;

    if (fileExtension === 'pdf') {
      const result = await extractPdfText(file);
      text = result.text;
      chapters = result.chapters;
      pagesCount = result.pagesCount;
    } else {
      const result = await extractEpubText(file);
      text = result.text;
      chapters = result.chapters;
      // We estimate EPUB pages based on character count (approx 2000 chars per page)
      pagesCount = Math.max(1, Math.ceil(text.length / 2000));
    }

    const detectedLanguage = detectLanguage(text);
    console.log('Detected language in processFile:', detectedLanguage);

    const metadata = {
      totalCharacters: text.length,
      language: detectedLanguage,
      processedPages: pagesCount
    };

    // Create an initial chapter with metadata if no chapters exist
    const firstChapter: Chapter = {
      title: 'Chapter 1',
      startIndex: 0,
      metadata: { 
        language: detectedLanguage 
      }
    };
    
    // Use the existing chapters or create one with the detected language
    const updatedChapters = chapters?.length > 0 
      ? chapters.map((chapter, index) => ({
          ...chapter,
          metadata: { 
            ...chapter.metadata,
            language: detectedLanguage 
          }
        }))
      : [firstChapter];

    console.log('Returning with language:', detectedLanguage);
    console.log('First chapter metadata:', updatedChapters[0].metadata);
    console.log('Total characters:', text.length);
    console.log('Estimated pages:', pagesCount);

    return {
      text,
      metadata: {
        ...metadata,
        chapters: updatedChapters
      }
    };
  } catch (error) {
    console.error(`Error processing ${fileExtension} file:`, error);
    throw error;
  }
};
