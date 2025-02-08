
import ePub, { Book, Spine } from 'epubjs';
import { Chapter } from './textExtraction';

// Add type definition for Spine to include the properties we need
interface ExtendedSpine extends Spine {
  load: () => Promise<any>;
  items: Array<{
    href: string;
  }>;
}

export const extractEpubText = async (file: File): Promise<{ text: string; chapters: Chapter[] }> => {
  try {
    console.log('Starting EPUB text extraction with chapter detection...');
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer) as Book & { spine: ExtendedSpine };
    
    // Wait for book to be ready
    await book.ready;
    
    // Load the spine properly
    await book.spine.load();
    let fullText = '';
    const chapters: Chapter[] = [];
    
    // Iterate through spine items correctly using items array
    for (const item of book.spine.items) {
      try {
        const contents = await book.load(item.href);
        // Ensure contents is a string before parsing
        const contentString = contents instanceof Document ? 
          contents.documentElement.outerHTML : 
          contents.toString();
        const doc = new DOMParser().parseFromString(contentString, 'text/html');
        
        // Look for chapter indicators in the content
        const { text, newChapters } = detectChaptersInEpub(
          doc, 
          fullText.length
        );
        
        fullText += text + '\n\n';
        chapters.push(...newChapters);
      } catch (error) {
        console.warn(`Failed to load spine item: ${item.href}`, error);
        continue;
      }
    }
    
    console.log('EPUB text extraction completed, total length:', fullText.length);
    console.log('Chapters detected:', chapters.length);
    return { text: fullText.trim(), chapters };
  } catch (error) {
    console.error('EPUB extraction error:', error);
    throw new Error('Failed to extract text from EPUB');
  }
};

const detectChaptersInEpub = (doc: Document, startIndex: number): { text: string; newChapters: Chapter[] } => {
  const newChapters: Chapter[] = [];
  let text = '';

  // Common chapter heading selectors
  const headingSelectors = [
    'h1', 'h2', 'h3',
    '[class*="chapter"]',
    '[class*="title"]',
    '[role="heading"]'
  ];

  // Find potential chapter headings
  headingSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(element => {
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
  });

  // Extract all text content
  text = doc.body.textContent?.trim() || '';

  return { text, newChapters };
};
