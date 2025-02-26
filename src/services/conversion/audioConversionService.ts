
import { convertTextToAudio } from './audio/conversionService';
import { TextChunkCallback } from './types/chunks';

export async function convertToAudio(
  text: string,
  voiceId: string,
  onProgress?: TextChunkCallback
): Promise<{ audio: ArrayBuffer; id: string }> {
  return convertTextToAudio(text, voiceId, onProgress);
}
