
import { PostgrestResponse } from '@supabase/supabase-js';

export interface ExtractedChapter {
  title: string;
  startIndex: number;
  timestamp?: number;
  metadata?: {
    language?: string;
  };
  confidence?: number;
  type?: 'pattern' | 'style' | 'heading';
}

export interface DatabaseChapter {
  conversion_id: string;
  title: string;
  start_index: number;
  timestamp: number;
  created_at?: string;
  id?: string;
}

export interface ChapterWithTimestamp extends ExtractedChapter {
  timestamp: number;
}

export interface TextConversion {
  id: string;
  user_id: string | null;
  status: string;
  file_name: string;
  text_hash: string;
  progress: number;
  notify_on_complete: boolean;
  duration?: number;
}

export type { PostgrestResponse };
