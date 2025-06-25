
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
  /^preface/i,
  /^acknowledgments?/i,
  /^table\s+of\s+contents?/i
] as const;

// Enhanced heading selectors in priority order
const HEADING_SELECTORS = [
  'h1',
  'h2',
  '[class*="chapter"]',
  '[class*="title"]',
  '[role="heading"]',
  'h3',
  '[class*="heading"]',
  '[class*="header"]',
  'strong[style*="font-size"]',
  'div[style*="font-weight: bold"]',
  'p[style*="font-weight: bold"]'
] as const;

// Average words per minute for estimating timestamps
const WORDS_PER_MINUTE = 150;

const isVisibleElement = (element: Element): boolean => {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const calculateConfidence = (
  element: Element, 
  title: string, 
  isChapterPattern: boolean
): number => {
  let confidence = 0;
  
  // Base confidence from pattern match
  if (isChapterPattern) confidence += 0.5;
  
  // Check if element is a heading
  if (element.tagName.match(/^H[1-3]$/)) confidence += 0.3;
  
  // Check text characteristics
  if (title === title.toUpperCase()) confidence += 0.2;
  if (title.length > 3 && title.length < 100) confidence += 0.1;
  
  // Style characteristics
  const styles = window.getComputedStyle(element);
  if (parseInt(styles.fontSize) >= 16) confidence += 0.2;
  if (styles.fontWeight === 'bold' || parseInt(styles.fontWeight) >= 600) confidence += 0.1;
  
  return Math.min(confidence, 1);
};

export const detectChaptersInEpub = (doc: Document, startIndex: number): { text: string; newChapters: Chapter[] } => {
  const newChapters: Chapter[] = [];
  let text = '';

  try {
    // Find potential chapter headings using combined selectors
    const elements = Array.from(doc.querySelectorAll(HEADING_SELECTORS.join(',')));
    
    // Process elements for chapter detection
    elements.forEach((element, index) => {
      const title = element.textContent?.trim();
      
      if (title && title.length >= 3 && title.length < 100) {
        const isChapterPattern = CHAPTER_PATTERNS.some(pattern => pattern.test(title));
        const styles = window.getComputedStyle(element);
        const fontSize = parseInt(styles.fontSize);
        const isLargeText = fontSize >= 16;
        const isUpperCase = title === title.toUpperCase();
        const isVisible = isVisibleElement(element);
        
        if (isVisible && (isChapterPattern || isLargeText || isUpperCase)) {
          const confidence = calculateConfidence(element, title, isChapterPattern);
          
          if (confidence >= 0.3) { // Minimum confidence threshold
            const textBeforeChapter = text;
            const wordCount = textBeforeChapter.split(/\s+/).length;
            const minutesMark = Math.max(Math.floor(wordCount / WORDS_PER_MINUTE), 0);

            console.log('Chapter detected:', {
              title,
              confidence,
              isChapterPattern,
              isLargeText,
              isUpperCase,
              fontSize
            });

            // Create complete Chapter object with all required properties
            newChapters.push({
              id: `chapter-${index}`,
              title,
              startIndex: startIndex + text.length,
              startTime: minutesMark * 60, // Convert minutes to seconds
              endTime: 0, // Will be set later when processing is complete
              timestamp: minutesMark,
              confidence,
              type: isChapterPattern ? 'pattern' : isLargeText ? 'style' : 'heading'
            });
          }
        }
      }
    });

    // Extract text content more efficiently
    const textContent = doc.body?.textContent || '';
    text = textContent.replace(/\s+/g, ' ').trim();

    // Sort chapters by confidence and position
    newChapters.sort((a, b) => {
      if (Math.abs(a.confidence! - b.confidence!) > 0.3) {
        return b.confidence! - a.confidence!;
      }
      return a.startIndex - b.startIndex;
    });

    return { text, newChapters };
  } catch (error) {
    console.warn('Error in chapter detection:', error);
    return { text: '', newChapters: [] };
  }
};

export function detectChaptersFromDOM(dom: Document, text: string): Chapter[] {
  const chapters: Chapter[] = [];
  const headings = dom.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  headings.forEach((heading, index) => {
    const title = heading.textContent?.trim() || `Chapter ${index + 1}`;
    const startIndex = text.indexOf(title);
    
    if (startIndex !== -1) {
      chapters.push({
        id: `chapter-${index}`,
        title,
        startIndex,
        startTime: 0,
        endTime: 0,
        timestamp: Date.now(),
        confidence: 0.8,
        type: 'heading' as const
      });
    }
  });
  
  return chapters;
}
