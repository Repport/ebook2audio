
import { CacheError } from '../errors/CacheError';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    retryCount?: number;
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    timeout?: number;
    operation?: string;
  } = {}
): Promise<T> {
  const {
    retryCount = 0,
    maxRetries = MAX_RETRIES,
    initialDelay = INITIAL_RETRY_DELAY,
    maxDelay = 10000,
    timeout = 30000,
    operation: opName = 'Operation'
  } = options;

  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new CacheError(`${opName} timed out after ${timeout}ms`)), timeout);
    });
    return await Promise.race([operation(), timeoutPromise]) as T;
  } catch (error) {
    if (retryCount >= maxRetries) {
      console.error(`${opName} failed after ${maxRetries} retries:`, error);
      throw error;
    }

    const exponentialDelay = initialDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000;
    const delay = Math.min(exponentialDelay + jitter, maxDelay);
    
    console.log(`${opName}: Retry attempt ${retryCount + 1} after ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryOperation(operation, {
      ...options,
      retryCount: retryCount + 1
    });
  }
}
