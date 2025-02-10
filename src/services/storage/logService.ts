
import { supabase } from '@/integrations/supabase/client';

export async function logStorageOperation(
  operation: string,
  storagePath: string | null,
  status: 'started' | 'completed' | 'failed',
  error?: Error | null,
  fileSize?: number,
  contentType?: string,
  conversionId?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found for logging storage operation');
      return;
    }

    const { error: logError } = await supabase
      .from('storage_logs')
      .insert({
        operation,
        storage_path: storagePath,
        status,
        error_message: error?.message,
        file_size: fileSize,
        content_type: contentType,
        user_id: user.id,
        conversion_id: conversionId
      });

    if (logError) {
      console.error('Failed to log storage operation:', logError);
    }
  } catch (error) {
    console.error('Error logging storage operation:', error);
  }
}
