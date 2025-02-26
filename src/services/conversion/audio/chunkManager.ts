
import { splitTextIntoChunks } from '../utils';
import { TextChunkCallback, ChunkProgressData } from '../types/chunks';

const CHUNK_SIZE = 4800;

export interface ProcessChunkResult {
  buffer: ArrayBuffer;
  index: number;
}

export interface ChunkProcessingContext {
  totalChunks: number;
  totalCharacters: number;
  onProgress?: TextChunkCallback;
}

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

  constructor(text: string, onProgress?: TextChunkCallback) {
    this.chunks = splitTextIntoChunks(text, CHUNK_SIZE);
    this.totalChunks = this.chunks.length;
    this.totalCharacters = text.length;
    this.onProgress = onProgress;
    
    console.log(`Text split into ${this.chunks.length} chunks`);
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
   * Registra un chunk procesado en el mapa
   */
  registerProcessedChunk(index: number, buffer: ArrayBuffer): void {
    this.processedChunksMap.set(index, buffer);
    
    // Actualizar el contador de caracteres procesados
    this.localProcessedCharacters += this.chunks[index].length;
    
    // Notificar progreso
    if (this.onProgress) {
      const progressData: ChunkProgressData = {
        processedChunks: this.processedChunksMap.size,
        totalChunks: this.totalChunks,
        processedCharacters: this.localProcessedCharacters,
        totalCharacters: this.totalCharacters,
        currentChunk: this.chunks[index],
        progress: Math.round((this.localProcessedCharacters / this.totalCharacters) * 100)
      };
      this.onProgress(progressData);
    }
  }
  
  /**
   * Registra un error al procesar un chunk
   */
  registerChunkError(index: number, error: Error): void {
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
