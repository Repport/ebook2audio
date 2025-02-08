
import * as pdfjs from 'pdfjs-dist';

// Initialize PDF.js worker
const workerSrc = `
  self.onmessage = function(e) {
    postMessage({
      type: 'ready'
    });
  };
`;

pdfjs.GlobalWorkerOptions.workerSrc = `data:application/javascript;base64,${btoa(workerSrc)}`;

export const extractPdfText = async (file: File): Promise<string> => {
  try {
    console.log('Starting PDF text extraction...');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i} of ${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    console.log('PDF text extraction completed');
    return fullText.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};
