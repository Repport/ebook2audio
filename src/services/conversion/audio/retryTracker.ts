
/**
 * Manages tracking of retries for chunks
 */
export class RetryTracker {
  private retryCountMap = new Map<number, number>();

  /**
   * Gets the retry count for a specific chunk
   */
  public getRetryCount(index: number): number {
    return this.retryCountMap.get(index) || 0;
  }

  /**
   * Increments the retry count for a specific chunk
   */
  public incrementRetryCount(index: number): void {
    const currentCount = this.retryCountMap.get(index) || 0;
    this.retryCountMap.set(index, currentCount + 1);
  }
  
  /**
   * Clears all retry counts
   */
  public clearRetryCounts(): void {
    this.retryCountMap.clear();
  }
}
