import { PostgrestError, PostgrestResponse } from '@supabase/supabase-js';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

interface RetryOptions {
  retryCount?: number;
  maxRetries?: number;
  baseDelay?: number;
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
    baseDelay = INITIAL_RETRY_DELAY,
    maxDelay = 10000,
    operation: opName = 'Operation'
  } = options;

  try {
    const result = await operation();

    if (result && typeof result === 'object' && 'error' in result) {
      const supabaseResult = result as { error: PostgrestError | null };
      if (supabaseResult.error) {
        console.error(`${opName} - Supabase error:`, supabaseResult.error);
        throw supabaseResult.error;
      }
    }

    return result;
  } catch (error) {
    if (retryCount >= maxRetries) {
      console.error(`${opName} failed after ${maxRetries} retries:`, error);
      throw error;
    }

    if (error instanceof PostgrestError) {
      console.warn(`⚠️ ${opName} - PostgrestError: ${error.message}`, {
        details: error.details,
        hint: error.hint,
      });
    }

    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000;
    const delay = Math.min(exponentialDelay + jitter, maxDelay);
    
    console.log(`🔄 ${opName}: Retry attempt ${retryCount + 1} after ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryOperation(operation, {
      ...options,
      retryCount: retryCount + 1
    });
  }
}

export async function safeSupabaseQuery<T>(
  supabaseClient: any,
  table: string,
  action: 'insert' | 'update' | 'delete',
  data: Partial<T> | string, // `string` para DELETE, `Partial<T>` para insert/update
  options: RetryOptions = {}
): Promise<PostgrestResponse<T>> {
  return retryOperation(
    async () => {
      let query;
      if (action === 'insert') {
        query = supabaseClient.from(table).insert(data).select().single();
      } else if (action === 'update') {
        query = supabaseClient.from(table).update(data).eq('id', (data as any).id).select().single();
      } else if (action === 'delete') {
        query = supabaseClient.from(table).delete().eq('id', data as string);
      } else {
        throw new Error(`Unsupported action: ${action}`);
      }

      const response = await query;

      if (response?.error) {
        console.error(`❌ ${action.toUpperCase()} ${table} failed:`, response.error);
        throw new Error(response.error.message);
      }

      return response;
    },
    {
      ...options,
      operation: `${action.toUpperCase()} ${table}`
    }
  );
}

export async function safeSupabaseUpdate<T>(
  supabaseClient: any,
  table: string,
  id: string,
  data: Partial<T>,
  options: RetryOptions = {}
): Promise<PostgrestResponse<T>> {
  return retryOperation(
    async () => {
      const response = await supabaseClient
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (response?.error) {
        console.error(`❌ Update ${table} failed:`, response.error);
        throw new Error(response.error.message);
      }

      return response;
    },
    {
      ...options,
      operation: `Update ${table}`
    }
  );
}
