
import ePub, { Book } from 'epubjs';
import { Chapter } from './textExtraction';

// Define types for spine items
interface SpineItem {
  href: string;
  // Add other properties if needed
}

interface ExtendedSpine {
  items: SpineItem[];
}

export const extractEpubText = async (file: File): Promise<{ text: string; chapters: Chapter[] }> => {
  try {
    console.log('Starting EPUB text extraction with chapter detection...');
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    
    // Wait for book to be ready
    await book.ready;
    
    let fullText = '';
    const chapters: Chapter[] = [];
    
    // Get spine items directly from the book's spine
    const spine = book.spine as unknown as ExtendedSpine;
    console.log('Spine loaded:', spine);
    
    // Iterate through spine items using the correct property
    for (const section of spine.items) {
      try {
        const contents = await book.load(section.href);
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
        console.warn(`Failed to load spine item: ${section.href}`, error);
        continue;
      }
    }
    
    console.log('EPUB text extraction completed, total length:', fullText.length);
    console.log('Chapters detected:', chapters.length);
    
    if (!fullText.trim()) {
      throw new Error('No text content extracted from EPUB');
    }
    
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
