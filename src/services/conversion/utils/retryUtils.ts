
import { PostgrestError, PostgrestResponse } from '@supabase/supabase-js';

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
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retryCount = 0,
    maxRetries = MAX_RETRIES,
    initialDelay = INITIAL_RETRY_DELAY,
    maxDelay = 10000,
    operation: opName = 'Operation'
  } = options;

  try {
    const result = await operation();
    
    // Manejo específico para respuestas de Supabase
    if (result && typeof result === 'object' && 'error' in result) {
      const supabaseResult = result as { error: PostgrestError | null };
      if (supabaseResult.error) {
        throw supabaseResult.error;
      }
    }
    
    return result;
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

export async function safeSupabaseUpdate<T>(
  supabaseClient: any,
  table: string,
  id: string,
  data: Partial<T>,
  options: RetryOptions = {}
): Promise<PostgrestResponse<T>> {
  try {
    const result = await retryOperation(
      async () => {
        const response = await supabaseClient
          .from(table)
          .update(data)
          .eq('id', id)
          .select()
          .single();

        // Verificación explícita de error
        if (response?.error) {
          throw new Error(response.error.message);
        }

        return response;
      },
      {
        ...options,
        operation: `Update ${table}`
      }
    );

    return result;
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    throw error;
  }
}
