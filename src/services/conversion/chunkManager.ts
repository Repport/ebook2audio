
import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "./utils";

export interface ConversionChunk {
  id: string;
  conversion_id: string;
  chunk_index: number;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audio_path?: string;
  error_message?: string;
}

export async function createChunksForConversion(
  conversionId: string,
  text: string,
  chunkSize: number = 5000
): Promise<ConversionChunk[]> {
  const chunks = splitTextIntoChunks(text, chunkSize);
  const chunkRecords = chunks.map((content, index) => ({
    conversion_id: conversionId,
    chunk_index: index,
    content,
    status: 'pending'
  }));

  const { data, error } = await supabase
    .from('conversion_chunks')
    .insert(chunkRecords)
    .select();

  if (error) {
    console.error('Error creating chunks:', error);
    throw error;
  }

  return data;
}

export async function updateChunkStatus(
  chunkId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  audioPath?: string,
  errorMessage?: string
): Promise<void> {
  await retryOperation(async () => {
    const { error } = await supabase.rpc('update_chunk_status', {
      p_chunk_id: chunkId,
      p_status: status,
      p_audio_path: audioPath,
      p_error_message: errorMessage
    });

    if (error) {
      console.error('Error updating chunk status:', error);
      throw error;
    }
  });
}

export async function getConversionChunks(conversionId: string): Promise<ConversionChunk[]> {
  const { data, error } = await supabase
    .from('conversion_chunks')
    .select('*')
    .eq('conversion_id', conversionId)
    .order('chunk_index');

  if (error) {
    console.error('Error fetching chunks:', error);
    throw error;
  }

  return data;
}

function splitTextIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by sentences while preserving punctuation
  const sentences = text.split(/([.!?]+\s+)/);

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const potentialChunk = currentChunk + sentence;

    // If adding the next sentence would exceed chunkSize, save current chunk
    if (potentialChunk.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = potentialChunk;
    }
  }

  // Add the last chunk if there's any remaining text
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.trim().length > 0);
}
