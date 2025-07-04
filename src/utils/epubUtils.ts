import ePub from 'epubjs';
import { Chapter } from './textExtraction';
import { SpineItem, ExtendedSpine, ProcessedChunk } from './epubTypes';
import { detectChaptersInEpub } from './epubChapterDetection';

const CHUNK_SIZE = 5; // Number of spine items to process in parallel

const validateInputFile = (file: File): void => {
  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file provided');
  }

  if (!file.name.toLowerCase().endsWith('.epub')) {
    throw new Error('File must be an EPUB document');
  }
};

const processSpineChunk = async (
  chunk: SpineItem[],
  book: any,
  currentTextLength: number
): Promise<ProcessedChunk[]> => {
  return Promise.all(
    chunk.map(async (section) => {
      try {
        if (!section.href) {
          console.warn('Section missing href, skipping');
          return { text: '', newChapters: [] };
        }

        const contents = await book.load(section.href);
        const contentString = contents instanceof Document ? 
          contents.documentElement.outerHTML : 
          contents.toString();

        if (!contentString.trim()) {
          console.warn(`Empty content in section: ${section.href}`);
          return { text: '', newChapters: [] };
        }

        const doc = new DOMParser().parseFromString(contentString, 'text/html');
        return detectChaptersInEpub(doc, currentTextLength);
      } catch (error) {
        console.warn(`Failed to process section ${section.href}:`, error);
        return { text: '', newChapters: [] };
      }
    })
  );
};

export async function extractChaptersFromEpub(epub: any): Promise<Chapter[]> {
  const chapters: Chapter[] = [];
  
  try {
    const spine = epub.spine;
    
    for (let i = 0; i < spine.length; i++) {
      const section = spine.get(i);
      const doc = await section.load(epub.load.bind(epub));
      const title = section.navItem?.label || `Chapter ${i + 1}`;
      
      chapters.push({
        id: `chapter-${i}`,
        title,
        startIndex: 0,
        startTime: 0,
        endTime: 0,
      });
    }
  } catch (error) {
    console.error('Error extracting chapters from EPUB:', error);
  }
  
  return chapters;
}

export const extractEpubText = async (file: File): Promise<{ text: string; chapters: Chapter[] }> => {
  try {
    console.log('Starting EPUB text extraction with chapter detection...');
    validateInputFile(file);

    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Empty file provided');
    }

    const book = ePub(arrayBuffer);
    await book.ready;
    
    let fullText = '';
    const chapters: Chapter[] = [];
    
    const spine = book.spine as unknown as ExtendedSpine;
    console.log('Spine loaded:', spine);
    
    if (!spine?.items?.length) {
      throw new Error('No content found in EPUB file');
    }

    // Process spine items in parallel with chunk size limit
    for (let i = 0; i < spine.items.length; i += CHUNK_SIZE) {
      const chunk = spine.items.slice(i, i + CHUNK_SIZE);
      const results = await processSpineChunk(chunk, book, fullText.length);

      // Aggregate results from the chunk
      results.forEach(({ text, newChapters }, chunkIndex) => {
        if (text) {
          fullText += text + '\n\n';
          // Create complete Chapter objects with all required properties
          newChapters.forEach((chapter, index) => {
            chapters.push({
              id: `chapter-${i + chunkIndex}-${index}`,
              title: chapter.title,
              startIndex: chapter.startIndex,
              startTime: 0, // Will be calculated based on text position
              endTime: 0,   // Will be set during processing
            });
          });
        }
      });
    }
    
    const finalText = fullText.trim();
    console.log('EPUB text extraction completed successfully:', {
      textLength: finalText.length,
      chaptersCount: chapters.length
    });
    
    if (!finalText) {
      throw new Error('No text content could be extracted from EPUB');
    }
    
    return { text: finalText, chapters };
  } catch (error) {
    console.error('EPUB extraction error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to extract text from EPUB');
  }
};
