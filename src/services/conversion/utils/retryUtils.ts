
import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

interface RetryOptions {
  retryCount?: number;
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  operation?: string;
}

export async function retryOperation<T>(
  operation: () => Promise<PostgrestResponse<T>>,
  options: RetryOptions = {}
): Promise<PostgrestResponse<T>> {
  const {
    retryCount = 0,
    maxRetries = MAX_RETRIES,
    initialDelay = INITIAL_RETRY_DELAY,
    maxDelay = 10000,
    operation: opName = 'Operation'
  } = options;

  try {
    const result = await operation();
    
    if (result.error) {
      throw result.error;
    }
    
    return result;
  } catch (error) {
    if (retryCount >= maxRetries) {
      console.error(`${opName} failed after ${maxRetries} retries:`, error);
      return { data: null, error: error as PostgrestError, count: null, status: 500, statusText: 'ERROR' };
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

export async function safeSupabaseUpdate<T>(
  supabaseClient: any,
  table: string,
  id: string,
  data: Partial<T>,
  options: RetryOptions = {}
): Promise<PostgrestResponse<T>> {
  return retryOperation(
    () => supabaseClient
      .from(table)
      .update(data)
      .eq('id', id),
    {
      ...options,
      operation: `Update ${table}`
    }
  );
}
