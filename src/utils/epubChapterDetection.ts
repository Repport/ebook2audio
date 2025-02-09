
import { Chapter } from './textExtraction';

// Enhanced chapter heading patterns
const CHAPTER_PATTERNS = [
  /^chapter\s+(\d+|[IVXLC]+)/i,
  /^(\d+\.?\s*)/,
  /^part\s+(\d+|[IVXLC]+)/i,
  /^book\s+(\d+|[IVXLC]+)/i,
  /^section\s+(\d+|[IVXLC]+)/i,
  /^prologue/i,
  /^epilogue/i,
  /^introduction/i,
  /^appendix\s+([A-Z]|\d+)/i,
  /^afterword/i,
] as const;

// Common chapter heading selectors in priority order
const HEADING_SELECTORS = [
  'h1',
  'h2',
  '[class*="chapter"]',
  '[class*="title"]',
  '[role="heading"]',
  'h3',
  '[class*="heading"]',
  '[class*="header"]'
] as const;

// Average words per minute for estimating timestamps
const WORDS_PER_MINUTE = 150;

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
          const isChapter = CHAPTER_PATTERNS.some(pattern => pattern.test(title));
          const fontSize = window.getComputedStyle(element).fontSize;
          const isLargeText = parseInt(fontSize) >= 16;

          if (isChapter || (element.tagName.toLowerCase() === 'h1' && isLargeText)) {
            // Get word count for timestamp calculation
            const textBeforeChapter = text;
            const wordCount = textBeforeChapter.split(/\s+/).length;
            const minutesMark = Math.floor(wordCount / WORDS_PER_MINUTE);

            newChapters.push({
              title,
              startIndex: startIndex + text.length,
              timestamp: minutesMark
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
