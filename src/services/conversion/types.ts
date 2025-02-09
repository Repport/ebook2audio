
import { Chapter } from "@/utils/textExtraction";

export interface ChapterWithTimestamp extends Chapter {
  timestamp: number;
}

export type ProgressCallback = (progress: number, totalChunks: number, completedChunks: number) => void;
