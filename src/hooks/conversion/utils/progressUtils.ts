
import { TextChunkCallback } from '@/services/conversion/types/chunks';

export const createProgressTracker = (
  totalCharacters: number,
  setProgress: (progress: number) => void
): TextChunkCallback => {
  return (chunkText: string, processed: number, total: number) => {
    const progress = Math.min(
      Math.round((processed / totalCharacters) * 90) + 5,
      95
    );
    console.log(`📊 Progress update: ${progress}% (${processed}/${totalCharacters} characters)`);
    setProgress(progress);
  };
};
