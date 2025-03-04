
import { splitTextIntoChunks } from '../utils';
import { TextChunkCallback, ChunkProgressData } from '../types/chunks';
import { calculateProgressData, saveProgressToLocalStorage } from './progressUtils';
import { RetryTracker } from './retryTracker';
import { ChunkProcessingContext } from './types/chunkTypes';

const CHUNK_SIZE = 4800;

/**
 * Divide el texto en chunks y gestiona la distribución del procesamiento
 */
export class ChunkManager {
  private chunks: string[];
  private processedChunksMap = new Map<number, ArrayBuffer>();
  private totalChunks: number;
  private totalCharacters: number;
  private onProgress?: TextChunkCallback;
  private localProcessedCharacters = 0;
  private instanceId: string;
  private lastProgressUpdate: number = 0;
  private MIN_UPDATE_INTERVAL = 100; // Reduced from 300ms to 100ms for more responsive updates
  private retryTracker: RetryTracker;

  constructor(text: string, onProgress?: TextChunkCallback) {
    this.instanceId = crypto.randomUUID().substring(0, 8);
    this.chunks = splitTextIntoChunks(text, CHUNK_SIZE);
    this.totalChunks = this.chunks.length;
    this.totalCharacters = text.length;
    this.onProgress = onProgress;
    this.retryTracker = new RetryTracker();
    
    console.log(`[ChunkManager-${this.instanceId}] Text split into ${this.chunks.length} chunks, total ${text.length} characters`);
    
    // Send initial progress update immediately with more info about total chunks
    this.sendProgressUpdate(0, null, true);
  }

  /**
   * Obtiene el número total de chunks
   */
  getTotalChunks(): number {
    return this.totalChunks;
  }
  
  /**
   * Obtiene el número total de caracteres
   */
  getTotalCharacters(): number {
    return this.totalCharacters;
  }
  
  /**
   * Obtiene el chunk en un índice específico
   */
  getChunk(index: number): string {
    return this.chunks[index];
  }
  
  /**
   * Obtiene todos los chunks
   */
  getAllChunks(): string[] {
    return this.chunks;
  }
  
  /**
   * Actualiza los metadatos iniciales para asegurar valores correctos de rastreo
   */
  updateInitialMetadata(totalChunks: number, totalCharacters: number): void {
    // Only update if our initial values were incorrect
    if (this.totalChunks !== totalChunks || this.totalCharacters !== totalCharacters) {
      console.log(`[ChunkManager-${this.instanceId}] Updating metadata: chunks ${this.totalChunks} -> ${totalChunks}, chars ${this.totalCharacters} -> ${totalCharacters}`);
      this.totalChunks = totalChunks;
      this.totalCharacters = totalCharacters;
      
      // Force a progress update with new metadata
      this.sendProgressUpdate(0, null, true);
    }
  }
  
  /**
   * Obtiene el número de reintentos para un chunk específico
   */
  getRetryCount(index: number): number {
    return this.retryTracker.getRetryCount(index);
  }
  
  /**
   * Incrementa el contador de reintentos para un chunk específico
   */
  incrementRetryCount(index: number): void {
    this.retryTracker.incrementRetryCount(index);
  }

  /**
   * Envía una actualización de progreso con datos actuales
   * @param additionalChars - Caracteres adicionales procesados
   * @param currentChunk - Chunk actual siendo procesado
   * @param forceUpdate - Forzar actualización sin importar el throttling
   */
  private sendProgressUpdate(additionalChars: number, currentChunk: string | null, forceUpdate = false): void {
    const now = Date.now();
    
    // Throttle updates to prevent too many calls, unless forced or at beginning/end
    if (!forceUpdate && now - this.lastProgressUpdate < this.MIN_UPDATE_INTERVAL) {
      return;
    }
    
    this.lastProgressUpdate = now;
    
    if (this.onProgress) {
      // Track processed characters
      if (additionalChars > 0) {
        this.localProcessedCharacters += additionalChars;
      }
      
      const progressData = calculateProgressData(
        this.processedChunksMap.size,
        this.totalChunks,
        this.localProcessedCharacters,
        this.totalCharacters,
        currentChunk,
        this.instanceId
      );
      
      // Asegurarnos de que todos los valores son correctos antes de enviar la actualización
      this.onProgress(progressData);
      
      // Guardar localmente para debug
      saveProgressToLocalStorage(
        progressData.progress,
        this.processedChunksMap.size,
        this.totalChunks,
        this.localProcessedCharacters,
        this.totalCharacters
      );
    }
  }

  /**
   * Registra un chunk procesado en el mapa
   */
  registerProcessedChunk(index: number, buffer: ArrayBuffer): void {
    // Skip if this chunk was already processed to avoid double-counting
    if (this.processedChunksMap.has(index)) {
      console.log(`[ChunkManager-${this.instanceId}] Chunk ${index + 1} was already processed, skipping`);
      return;
    }
    
    this.processedChunksMap.set(index, buffer);
    
    // Calculate the number of characters in this chunk
    const chunkLength = this.chunks[index].length;
    
    // Check if we're reaching completion to force progress update
    const isNearingCompletion = this.processedChunksMap.size >= this.totalChunks - 1;
    
    // Send progress update
    this.sendProgressUpdate(chunkLength, this.chunks[index], isNearingCompletion);
    
    // Additional log for processed chunk
    console.log(`[ChunkManager-${this.instanceId}] Processed chunk ${index + 1}/${this.totalChunks}:`, {
      chunkSize: `${(buffer.byteLength / 1024).toFixed(2)} KB`,
      chunkChars: chunkLength,
      totalProcessed: this.processedChunksMap.size,
      percentComplete: `${Math.round((this.processedChunksMap.size / this.totalChunks) * 100)}%`
    });
  }
  
  /**
   * Registra un error al procesar un chunk
   */
  registerChunkError(index: number, error: Error): void {
    console.error(`[ChunkManager-${this.instanceId}] Error processing chunk ${index + 1}:`, error);
    
    if (this.onProgress) {
      const progressData: ChunkProgressData = {
        processedChunks: this.processedChunksMap.size,
        totalChunks: this.totalChunks,
        processedCharacters: this.localProcessedCharacters,
        totalCharacters: this.totalCharacters,
        currentChunk: this.chunks[index],
        error: error instanceof Error ? error.message : String(error)
      };
      this.onProgress(progressData);
    }
  }
  
  /**
   * Verifica si todos los chunks han sido procesados
   */
  areAllChunksProcessed(): boolean {
    return this.processedChunksMap.size === this.totalChunks;
  }
  
  /**
   * Obtiene los chunks faltantes
   */
  getMissingChunks(): number[] {
    const missing: number[] = [];
    for (let i = 0; i < this.totalChunks; i++) {
      if (!this.processedChunksMap.has(i)) {
        missing.push(i);
      }
    }
    return missing;
  }
  
  /**
   * Obtiene los buffers de audio procesados en orden
   */
  getOrderedBuffers(): ArrayBuffer[] {
    const orderedBuffers: ArrayBuffer[] = [];
    for (let i = 0; i < this.totalChunks; i++) {
      const buffer = this.processedChunksMap.get(i);
      if (buffer) {
        orderedBuffers.push(buffer);
      }
    }
    return orderedBuffers;
  }
  
  /**
   * Notifica la finalización del proceso
   */
  notifyCompletion(): void {
    console.log(`[ChunkManager-${this.instanceId}] Process completed:`, {
      processedChunks: this.processedChunksMap.size,
      totalChunks: this.totalChunks,
      processedCharacters: this.localProcessedCharacters,
      totalCharacters: this.totalCharacters
    });
    
    if (this.onProgress) {
      this.onProgress({
        processedChunks: this.totalChunks,
        totalChunks: this.totalChunks,
        processedCharacters: this.totalCharacters,
        totalCharacters: this.totalCharacters,
        currentChunk: "",
        progress: 100,
        isCompleted: true
      });
    }
  }
}
