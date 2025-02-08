
import ePub, { Book } from 'epubjs';
import { Chapter } from './textExtraction';

// Define types for spine items with all possible properties
interface SpineItem {
  href: string;
  id?: string;
  linear?: boolean;
  properties?: string[];
  index?: number;
}

interface ExtendedSpine {
  items: SpineItem[];
}

export const extractEpubText = async (file: File): Promise<{ text: string; chapters: Chapter[] }> => {
  try {
    console.log('Starting EPUB text extraction with chapter detection...');
    
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file provided');
    }

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

    // Process spine items in parallel with a limit of 5 concurrent operations
    const chunkSize = 5;
    for (let i = 0; i < spine.items.length; i += chunkSize) {
      const chunk = spine.items.slice(i, i + chunkSize);
      const results = await Promise.all(
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
            return detectChaptersInEpub(doc, fullText.length);
          } catch (error) {
            console.warn(`Failed to process section ${section.href}:`, error);
            return { text: '', newChapters: [] };
          }
        })
      );

      // Aggregate results from the chunk
      results.forEach(({ text, newChapters }) => {
        if (text) {
          fullText += text + '\n\n';
          chapters.push(...newChapters);
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

const detectChaptersInEpub = (doc: Document, startIndex: number): { text: string; newChapters: Chapter[] } => {
  const newChapters: Chapter[] = [];
  let text = '';

  try {
    // Common chapter heading selectors in priority order
    const headingSelectors = [
      'h1',
      'h2',
      '[class*="chapter"]',
      '[class*="title"]',
      '[role="heading"]',
      'h3'
    ];

    // Find potential chapter headings
    for (const selector of headingSelectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(element => {
        const title = element.textContent?.trim();
        if (title && title.length < 100) { // Reasonable title length
          const chapterPattern = /^(chapter|section|part)\s+(\d+|[IVXLC]+)|^\d+\./i;
          if (chapterPattern.test(title) || element.tagName.toLowerCase() === 'h1') {
            newChapters.push({
              title,
              startIndex: startIndex + text.length
            });
          }
        }
      });
    }

    // Extract text content more efficiently
    const textContent = doc.body?.textContent || '';
    text = textContent.replace(/\s+/g, ' ').trim();

    return { text, newChapters };
  } catch (error) {
    console.warn('Error in chapter detection:', error);
    // Return empty result on error rather than throwing
    return { text: '', newChapters: [] };
  }
};
