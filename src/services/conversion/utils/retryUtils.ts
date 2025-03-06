
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
  } = {}
): Promise<T> {
  const {
    maxRetries = 2,
    baseDelay = 1000,
    operation: operationName = 'Operation', 
    shouldRetry = () => true
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
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`${operationName} - Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
}
