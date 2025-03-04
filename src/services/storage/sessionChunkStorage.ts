
/**
 * Module for handling chunked data storage in session storage
 */

const CHUNK_SIZE = 500000; // 500KB chunks

/**
 * Saves audio data to session storage in chunks
 */
export const saveAudioChunks = (audioData: string): void => {
  try {
    const chunks = Math.ceil(audioData.length / CHUNK_SIZE);
    sessionStorage.setItem('conversionState_chunks', chunks.toString());
    
    // Store each chunk separately
    for (let i = 0; i < chunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = start + CHUNK_SIZE;
      const chunk = audioData.slice(start, end);
      sessionStorage.setItem(`conversionState_chunk_${i}`, chunk);
    }
  } catch (error) {
    console.error('❌ Error saving audio chunks to session storage:', error);
  }
};

/**
 * Loads audio data from session storage chunks
 */
export const loadAudioChunks = (): string | null => {
  try {
    const chunks = parseInt(sessionStorage.getItem('conversionState_chunks') || '0');
    if (chunks <= 0) {
      return null;
    }
    
    let audioData = '';
    for (let i = 0; i < chunks; i++) {
      const chunk = sessionStorage.getItem(`conversionState_chunk_${i}`);
      if (chunk) {
        audioData += chunk;
      }
    }
    
    return audioData;
  } catch (error) {
    console.error('❌ Error loading audio chunks from session storage:', error);
    return null;
  }
};

/**
 * Clears audio chunks from session storage
 */
export const clearAudioChunks = (): void => {
  try {
    const chunks = parseInt(sessionStorage.getItem('conversionState_chunks') || '0');
    if (chunks > 0) {
      sessionStorage.removeItem('conversionState_chunks');
      for (let i = 0; i < chunks; i++) {
        sessionStorage.removeItem(`conversionState_chunk_${i}`);
      }
    }
  } catch (error) {
    console.error('❌ Error clearing audio chunks from session storage:', error);
  }
};
