
import * as pdfParse from 'pdf-parse';

export const extractPdfText = async (file: File): Promise<string> => {
  try {
    console.log('Starting PDF text extraction...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const pdfData = await pdfParse(buffer);
    const fullText = pdfData.text;
    
    console.log('PDF text extraction completed, total length:', fullText.length);
    return fullText.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};
