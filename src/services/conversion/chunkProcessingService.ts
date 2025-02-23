
import { supabase } from "@/integrations/supabase/client";
import { updateConversionStatus } from "./conversionManager";
import { combineAudioChunks } from "./utils/audioUtils";
import { splitTextIntoChunks } from "./utils";
import { processChunkBatch } from "./batchProcessor";
import type { ChunkProcessingOptions } from "./types/chunks";

const MAX_CONCURRENT_CHUNKS = 3; // Reducido para mejor manejo
const CHUNK_SIZE = 4800;

export async function processConversionChunks(
  text: string,
  voiceId: string,
  fileName: string | undefined,
  conversionId: string
): Promise<ArrayBuffer> {
  console.log('Iniciando procesamiento de chunks...');
  console.log(`Texto original: ${text.length} caracteres`);
  
  // Validar tamaño total del texto
  const totalBytes = new TextEncoder().encode(text).length;
  console.log(`Tamaño total del texto: ${totalBytes} bytes`);
  
  try {
    const chunks = splitTextIntoChunks(text, CHUNK_SIZE);
    const totalChunks = chunks.length;
    const totalCharacters = text.length;
    const audioBuffers: ArrayBuffer[] = [];

    // Validar cada chunk antes de procesar
    chunks.forEach((chunk, index) => {
      const chunkBytes = new TextEncoder().encode(chunk).length;
      console.log(`Validando chunk ${index + 1}/${totalChunks}:`);
      console.log(`- Bytes: ${chunkBytes}`);
      console.log(`- Caracteres: ${chunk.length}`);
      console.log(`- Primeras palabras: ${chunk.substring(0, 50)}...`);
      
      if (chunkBytes > CHUNK_SIZE) {
        throw new Error(`Chunk ${index + 1} excede el límite de ${CHUNK_SIZE} bytes (${chunkBytes} bytes)`);
      }
    });

    // Actualizar estado inicial
    await supabase
      .from('text_conversions')
      .update({
        status: 'processing',
        progress: 5,
        total_chunks: totalChunks,
        processed_chunks: 0,
        total_characters: totalCharacters,
        processed_characters: 0
      })
      .eq('id', conversionId);

    const options: ChunkProcessingOptions = {
      voiceId,
      fileName,
      conversionId,
      totalChunks,
      totalCharacters
    };

    // Procesar chunks en lotes pequeños
    for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_CHUNKS) {
      const batchChunks = chunks.slice(i, i + MAX_CONCURRENT_CHUNKS);
      console.log(`Procesando lote ${Math.floor(i / MAX_CONCURRENT_CHUNKS) + 1}/${Math.ceil(chunks.length / MAX_CONCURRENT_CHUNKS)}`);
      
      const batchBuffers = await processChunkBatch(
        batchChunks,
        i,
        options
      );

      audioBuffers.push(...batchBuffers);
    }

    // Actualizar estado final
    await updateConversionStatus(conversionId, 'completed', undefined, 100);

    console.log('Procesamiento de chunks completado exitosamente');
    return combineAudioChunks(audioBuffers);
  } catch (error) {
    console.error('Error durante el procesamiento de chunks:', error);
    await updateConversionStatus(conversionId, 'failed', error.message);
    throw error;
  }
}
