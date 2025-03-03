
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { Chapter } from './textExtraction';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

type TextItem = {
  str: string;
  fontSize?: number;
  fontName?: string;
};

export const extractPdfText = async (file: File): Promise<{ text: string; chapters: Chapter[], pagesCount: number }> => {
  try {
    console.log('Starting PDF text extraction with chapter detection...');
    const arrayBuffer = await file.arrayBuffer();
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const { pages, chapters } = await extractPagesAndChaptersFromPdf(pdf);
    const fullText = pages.join('\n\n');
    
    console.log('PDF text extraction completed, total length:', fullText.length);
    console.log('Chapters detected:', chapters.length);
    console.log('Total pages:', pdf.numPages);
    
    return { 
      text: fullText.trim(), 
      chapters,
      pagesCount: pdf.numPages
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

const extractPagesAndChaptersFromPdf = async (pdf: PDFDocumentProxy): Promise<{ pages: string[]; chapters: Chapter[] }> => {
  const pages: string[] = [];
  const chapters: Chapter[] = [];
  let currentTextIndex = 0;
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    const { text: pageText, newChapters } = detectChaptersInPage(
      textContent.items as TextItem[],
      currentTextIndex
    );
    
    pages.push(pageText);
    chapters.push(...newChapters);
    currentTextIndex += pageText.length + 2; // +2 for the \n\n between pages
  }
  
  return { pages, chapters };
};

const detectChaptersInPage = (items: TextItem[], startIndex: number): { text: string; newChapters: Chapter[] } => {
  const newChapters: Chapter[] = [];
  let lastFontSize = 0;
  let text = '';
  let potentialChapterStart = true;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const fontSize = item.fontSize || 0;
    const str = item.str.trim();

    if (str) {
      // Detect chapter by font size changes
      if (fontSize > lastFontSize && potentialChapterStart) {
        const chapterPattern = /^(chapter|section|part)\s+(\d+|[IVXLC]+)\.?\s*$/i;
        const numberPattern = /^\d+\.?\s*$/;
        
        if (
          chapterPattern.test(str) || 
          numberPattern.test(str) ||
          (fontSize >= 14 && str.length < 100) // Likely a title
        ) {
          newChapters.push({
            title: str,
            startIndex: startIndex + text.length
          });
        }
      }

      text += str + ' ';
      lastFontSize = fontSize;
      potentialChapterStart = str.endsWith('.') || str.endsWith('\n');
    } else {
      potentialChapterStart = true;
    }
  }

  return { text: text.trim(), newChapters };
};
