
import { Chapter } from './textExtraction';

// Common chapter heading selectors in priority order
const HEADING_SELECTORS = [
  'h1',
  'h2',
  '[class*="chapter"]',
  '[class*="title"]',
  '[role="heading"]',
  'h3'
] as const;

export const detectChaptersInEpub = (doc: Document, startIndex: number): { text: string; newChapters: Chapter[] } => {
  const newChapters: Chapter[] = [];
  let text = '';

  try {
    // Find potential chapter headings
    for (const selector of HEADING_SELECTORS) {
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
    return { text: '', newChapters: [] };
  }
};
