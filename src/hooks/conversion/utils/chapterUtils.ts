
import { ExtractedChapter, ChapterWithTimestamp } from '@/types/conversion';

export const convertToChaptersWithTimestamp = (chapters: ExtractedChapter[], totalCharacters: number): ChapterWithTimestamp[] => {
  const WORDS_PER_MINUTE = 150; // Average reading speed
  const CHARACTERS_PER_WORD = 5; // Average word length

  return chapters.map(chapter => {
    const charactersBeforeChapter = chapter.startIndex;
    const wordsBeforeChapter = charactersBeforeChapter / CHARACTERS_PER_WORD;
    const minutesMark = Math.floor(wordsBeforeChapter / WORDS_PER_MINUTE);

    return {
      ...chapter,
      timestamp: chapter.timestamp || minutesMark * 60 // Convert minutes to seconds if no timestamp exists
    };
  });
};
