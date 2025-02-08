
import ePub from 'epubjs';

export const extractEpubText = async (file: File): Promise<string> => {
  try {
    console.log('Starting EPUB text extraction...');
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    await book.ready;
    
    const spine = await book.loaded.spine;
    let fullText = '';
    
    // Iterate through spine items correctly
    for (const spineItem of spine) {
      try {
        const contents = await book.load(spineItem.href);
        // Ensure contents is a string before parsing
        const contentString = contents instanceof Document ? 
          contents.documentElement.outerHTML : 
          contents.toString();
        const doc = new DOMParser().parseFromString(contentString, 'text/html');
        fullText += doc.body.textContent + '\n\n';
      } catch (error) {
        console.warn(`Failed to load spine item: ${spineItem.href}`, error);
        continue;
      }
    }
    
    console.log('EPUB text extraction completed, total length:', fullText.length);
    return fullText.trim();
  } catch (error) {
    console.error('EPUB extraction error:', error);
    throw new Error('Failed to extract text from EPUB');
  }
};
