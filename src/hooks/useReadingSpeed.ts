
import { useState } from 'react';

export type ReadingSpeed = 'slow' | 'normal' | 'fast';

export interface ReadingSpeedConfig {
  wpm: number;
  label: string;
}

export const READING_SPEEDS: Record<ReadingSpeed, ReadingSpeedConfig> = {
  slow: { wpm: 120, label: 'Slow (120 WPM)' },
  normal: { wpm: 150, label: 'Normal (150 WPM)' },
  fast: { wpm: 180, label: 'Fast (180 WPM)' }
};

export const useReadingSpeed = (initialSpeed: ReadingSpeed = 'normal') => {
  const [readingSpeed, setReadingSpeed] = useState<ReadingSpeed>(initialSpeed);

  const calculateTimestamp = (wordCount: number): number => {
    return Math.max(Math.floor(wordCount / READING_SPEEDS[readingSpeed].wpm), 0);
  };

  return {
    readingSpeed,
    setReadingSpeed,
    calculateTimestamp,
    speeds: READING_SPEEDS
  };
};
