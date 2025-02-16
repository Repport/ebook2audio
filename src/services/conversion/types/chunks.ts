
export interface ConvertToAudioResponse {
  data: {
    audioContent: string;
  } | null;
  error: Error | null;
}

export interface ChunkUpdate {
  chunk_text: string;  // Make sure this is required
  conversion_id: string;
  chunk_index: number;
  status: string;
  audio_path?: string;
  error_message?: string;
}

export type ProgressCallback = (progress: number, totalChunks: number, completedChunks: number) => void;

export type TextChunkCallback = (chunkText: string, processedCharacters: number, totalCharacters: number) => void;
