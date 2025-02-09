
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { retryOperation } from "./utils";

type ConversionQueue = Database['public']['Tables']['conversion_queue']['Row'];

export async function addToQueue(textHash: string, userId: string | undefined): Promise<ConversionQueue> {
  // Check if already in queue
  const { data: existingQueue, error: queueCheckError } = await supabase
    .from('conversion_queue')
    .select()
    .eq('text_hash', textHash)
    .eq('status', 'pending')
    .maybeSingle();

  if (queueCheckError) throw queueCheckError;

  if (existingQueue) {
    return existingQueue;
  }

  return await retryOperation(async () => {
    const { data, error } = await supabase
      .from('conversion_queue')
      .insert({
        text_hash: textHash,
        user_id: userId,
        priority: 1,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create queue item');
    return data;
  });
}

export async function updateQueueStatus(
  queueId: string, 
  status: 'completed' | 'failed', 
  errorMessage?: string
): Promise<void> {
  await retryOperation(async () => {
    const updateData: any = {
      status,
      ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      ...(errorMessage ? { error_message: errorMessage } : {})
    };

    const { error: updateError } = await supabase
      .from('conversion_queue')
      .update(updateData)
      .eq('id', queueId);
    
    if (updateError) throw updateError;
  });
}
