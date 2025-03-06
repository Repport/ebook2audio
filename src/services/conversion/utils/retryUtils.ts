
/**
 * Utility for retrying operations with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    operation?: string;
    shouldRetry?: (error: any, attempt: number) => boolean;
    onBeforeRetry?: (error: any, attempt: number) => Promise<void> | void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 2,
    baseDelay = 1000,
    operation: operationName = 'Operation', 
    shouldRetry = (error, attempt) => {
      // Default retry logic - don't retry if these phrases are in error message
      const nonRetryableErrors = [
        'Invalid response format',
        'Maximum chunk size exceeded',
        'Unauthorized',
        'Rate limit exceeded',
        'Missing audioContent',
        'Duplicate chunk detected'
      ];
      
      for (const phrase of nonRetryableErrors) {
        if (error?.message?.includes(phrase)) {
          console.log(`${operationName} - Not retrying error with phrase "${phrase}"`);
          return false;
        }
      }
      
      // Don't retry too many times
      if (attempt > maxRetries) {
        console.log(`${operationName} - Maximum retry attempts (${maxRetries}) reached`);
        return false;
      }
      
      return true;
    },
    onBeforeRetry
  } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`${operationName} - Retry attempt ${attempt - 1}/${maxRetries}`);
      }
      
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`${operationName} attempt ${attempt}/${maxRetries + 1} failed:`, error.message);
      
      // Check if we should retry this specific error
      if (!shouldRetry(error, attempt)) {
        console.log(`${operationName} - Not retrying after error: ${error.message}`);
        throw error;
      }
      
      // Only retry if this wasn't the last attempt
      if (attempt <= maxRetries) {
        // Call the onBeforeRetry callback if provided
        if (onBeforeRetry) {
          await onBeforeRetry(error, attempt);
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`${operationName} - Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
}

// Create a cache to prevent redundant processing of identical content
const processedCache = new Map<string, any>();

/**
 * Clear the processed items cache
 */
export function clearProcessedCache(): void {
  processedCache.clear();
}

/**
 * Check if an item has been processed already using its key
 */
export function hasProcessedItem(key: string): boolean {
  return processedCache.has(key);
}

/**
 * Mark an item as processed with optional result value
 */
export function markAsProcessed(key: string, value?: any): void {
  processedCache.set(key, value || true);
}

/**
 * Get a processed item's value
 */
export function getProcessedItem(key: string): any {
  return processedCache.get(key);
}
