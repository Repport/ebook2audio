import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "./utils/retryUtils";

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
  chunkSize: number = 4800
): Promise<ConversionChunk[]> {
  const chunks = splitTextIntoChunks(text);
  const chunkRecords = chunks.map((content, index) => ({
    conversion_id: conversionId,
    chunk_index: index,
    content,
    status: 'pending' as const
  }));

  const { data, error } = await supabase
    .from('conversion_chunks')
    .insert(chunkRecords)
    .select('id, conversion_id, chunk_index, content, status, audio_path, error_message');

  if (error) {
    console.error('Error creating chunks:', error);
    throw error;
  }

  return (data || []).map(chunk => ({
    ...chunk,
    status: chunk.status as ConversionChunk['status']
  }));
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
    .select('id, conversion_id, chunk_index, content, status, audio_path, error_message')
    .eq('conversion_id', conversionId)
    .order('chunk_index');

  if (error) {
    console.error('Error fetching chunks:', error);
    throw error;
  }

  return (data || []).map(chunk => ({
    ...chunk,
    status: chunk.status as ConversionChunk['status']
  }));
}

function splitTextIntoChunks(text: string, chunkSize: number = 4800): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  const words = text.split(/\s+/);
  
  for (const word of words) {
    const testChunk = currentChunk + (currentChunk ? ' ' : '') + word;
    if (testChunk.length > chunkSize && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = word;
    } else {
      currentChunk = testChunk;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0);
}
