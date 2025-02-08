
import * as pdfjs from 'pdfjs-dist';
import { PDFWorker } from 'pdfjs-dist/types/src/display/worker_options';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
  ).toString();
}

export const extractPdfText = async (file: File): Promise<string> => {
  try {
    console.log('Starting PDF text extraction...');
    const arrayBuffer = await file.arrayBuffer();
    console.log('File loaded into ArrayBuffer, size:', arrayBuffer.byteLength);
    
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    console.log('PDF document loaded, pages:', pdf.numPages);
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i} of ${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
      console.log(`Page ${i} text extracted, length:`, pageText.length);
    }
    
    console.log('PDF text extraction completed, total length:', fullText.length);
    return fullText.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};
