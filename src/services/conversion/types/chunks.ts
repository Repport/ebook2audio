
export interface ConvertToAudioResponse {
  data: {
    audioContent: string;
  } | null;
  error: Error | null;
}

export interface ChunkUpdate {
  chunk_text: string;
  conversion_id: string;
  chunk_index: number;
  status: string;
  audio_path?: string;
  error_message?: string;
}

export type ProgressCallback = (progress: number, totalChunks: number, completedChunks: number) => void;
