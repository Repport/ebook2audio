
/**
 * Tracks retry attempts for chunks
 */
export class RetryTracker {
  private retryCounts: { [key: number]: number } = {};
  
  /**
   * Gets the retry count for a specific chunk
   */
  getRetryCount(index: number): number {
    return this.retryCounts[index] || 0;
  }
  
  /**
   * Increments the retry count for a specific chunk
   */
  incrementRetryCount(index: number): void {
    this.retryCounts[index] = this.getRetryCount(index) + 1;
  }
  
  /**
   * Gets all chunks that have been retried
   */
  getRetriedChunks(): number[] {
    return Object.keys(this.retryCounts).map(key => parseInt(key));
  }
  
  /**
   * Gets chunks that have reached max retries
   */
  getFailedChunks(maxRetries: number): number[] {
    return Object.entries(this.retryCounts)
      .filter(([_, count]) => count >= maxRetries)
      .map(([key, _]) => parseInt(key));
  }
  
  /**
   * Resets the retry count for a specific chunk
   */
  resetRetryCount(index: number): void {
    delete this.retryCounts[index];
  }
  
  /**
   * Resets all retry counts
   */
  resetAllRetryCounts(): void {
    this.retryCounts = {};
  }
}
