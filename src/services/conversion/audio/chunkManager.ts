
import { ChunkProgressUpdate, ChunkProcessingContext, ProcessChunkResult } from './types/chunkTypes';
import { RetryTracker } from './retryTracker';
import { calculateProgressData } from './progressUtils';
import { TextChunkCallback } from '../types/chunks';
import { v4 as uuidv4 } from 'uuid';

/**
 * Manages the processing of text chunks for conversion
 */
export class ChunkManager {
  private chunks: string[] = [];
  private processedChunks: {[key: number]: ArrayBuffer} = {};
  private retryTracker = new RetryTracker();
  private totalCharacters: number = 0;
  private processedCharacters: number = 0;
  private conversionId: string;
  private onProgress?: TextChunkCallback;
  
  constructor(text: string, onProgress?: TextChunkCallback) {
    this.splitTextIntoChunks(text);
    this.totalCharacters = text.length;
    this.onProgress = onProgress;
    this.conversionId = uuidv4();
    
    // Initial progress update
    this.updateProgress(0, null, true);
  }
  
  /**
   * Splits the input text into manageable chunks
   */
  private splitTextIntoChunks(text: string) {
    // Simple splitting by character count for demonstration
    // A more sophisticated implementation would respect sentence boundaries
    const chunkSize = 4500; // Keep chunks under 5000 characters
    let remainingText = text;
    
    while (remainingText.length > 0) {
      if (remainingText.length <= chunkSize) {
        this.chunks.push(remainingText);
        remainingText = '';
      } else {
        // Find a good breakpoint (end of sentence or paragraph)
        let splitPoint = remainingText.lastIndexOf('. ', chunkSize);
        splitPoint = splitPoint > 0 ? splitPoint + 1 : 
                      (remainingText.lastIndexOf('\n', chunkSize) > 0 ? 
                      remainingText.lastIndexOf('\n', chunkSize) : chunkSize);
        
        this.chunks.push(remainingText.substring(0, splitPoint));
        remainingText = remainingText.substring(splitPoint).trim();
      }
    }
    
    console.log(`Split text into ${this.chunks.length} chunks`);
  }
  
  /**
   * Gets the total number of chunks
   */
  getTotalChunks(): number {
    return this.chunks.length;
  }
  
  /**
   * Gets the total number of characters
   */
  getTotalCharacters(): number {
    return this.totalCharacters;
  }
  
  /**
   * Gets the content of a specific chunk
   */
  getChunkContent(index: number): string {
    if (index < 0 || index >= this.chunks.length) {
      throw new Error(`Invalid chunk index: ${index}`);
    }
    return this.chunks[index];
  }
  
  /**
   * Gets the conversion ID
   */
  getConversionId(): string {
    return this.conversionId;
  }
  
  /**
   * Gets the retry count for a specific chunk
   */
  getRetryCount(index: number): number {
    return this.retryTracker.getRetryCount(index);
  }
  
  /**
   * Increments the retry count for a specific chunk
   */
  incrementRetryCount(index: number): void {
    this.retryTracker.incrementRetryCount(index);
  }
  
  /**
   * Registers the result of processing a chunk
   */
  registerChunkResult(result: ProcessChunkResult): void {
    // Store the processed chunk
    this.processedChunks[result.index] = result.buffer;
    
    // Update processed characters count
    const chunkLength = this.getChunkContent(result.index).length;
    this.processedCharacters += chunkLength;
    
    // Update progress
    this.updateProgress(
      Object.keys(this.processedChunks).length,
      this.getChunkContent(result.index)
    );
  }
  
  /**
   * Updates the progress callback with current state
   */
  private updateProgress(processedChunksCount: number, currentChunk: string | null, forceUpdate: boolean = false): void {
    if (!this.onProgress) return;
    
    const updateData = {
      processedChunks: processedChunksCount,
      totalChunks: this.chunks.length,
      processedCharacters: this.processedCharacters,
      totalCharacters: this.totalCharacters,
      currentChunk,
      forceUpdate
    };
    
    this.onProgress(calculateProgressData(
      updateData.processedChunks,
      updateData.totalChunks,
      updateData.processedCharacters,
      updateData.totalCharacters,
      updateData.currentChunk,
      this.conversionId
    ));
  }
  
  /**
   * Gets an array of indices for missing chunks
   */
  getMissingChunks(): number[] {
    const missing: number[] = [];
    for (let i = 0; i < this.chunks.length; i++) {
      if (!this.processedChunks[i]) {
        missing.push(i);
      }
    }
    return missing;
  }
  
  /**
   * Gets an array of processed buffers in the correct order
   */
  getOrderedBuffers(): ArrayBuffer[] {
    const buffers: ArrayBuffer[] = [];
    for (let i = 0; i < this.chunks.length; i++) {
      if (this.processedChunks[i]) {
        buffers.push(this.processedChunks[i]);
      }
    }
    return buffers;
  }
  
  /**
   * Notifies the completion of all chunks
   */
  notifyCompletion(): void {
    if (!this.onProgress) return;
    
    // Final progress update with completion flag
    this.onProgress({
      processedChunks: this.chunks.length,
      totalChunks: this.chunks.length,
      processedCharacters: this.totalCharacters,
      totalCharacters: this.totalCharacters,
      currentChunk: 'Finalizado',
      progress: 100,
      isCompleted: true
    });
  }
}
