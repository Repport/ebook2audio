
import ePub from 'epubjs';

export const extractEpubText = async (file: File): Promise<string> => {
  try {
    console.log('Starting EPUB text extraction...');
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    await book.ready;
    
    const spine = await book.loaded.spine;
    let fullText = '';
    
    for (const item of spine.items) {
      const contents = await item.load();
      const doc = new DOMParser().parseFromString(contents, 'text/html');
      fullText += doc.body.textContent + '\n\n';
    }
    
    console.log('EPUB text extraction completed, total length:', fullText.length);
    return fullText.trim();
  } catch (error) {
    console.error('EPUB extraction error:', error);
    throw new Error('Failed to extract text from EPUB');
  }
};
