
import pdfParse from 'pdf-parse';

export const extractPdfText = async (file: File): Promise<string> => {
  try {
    console.log('Starting PDF text extraction with pdf-parse...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const data = await pdfParse(buffer);
    console.log('PDF text extraction completed, total length:', data.text.length);
    
    return data.text.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};
