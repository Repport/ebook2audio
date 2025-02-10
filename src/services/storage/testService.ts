
import { supabase } from '@/integrations/supabase/client';
import { logStorageOperation } from './logService';

export const testStorageConnection = async (): Promise<boolean> => {
  try {
    const testPath = `test-${Date.now()}.txt`;
    const testContent = 'Storage test';
    
    await logStorageOperation('test_connection', testPath, 'started');
    
    const { error: uploadError } = await supabase.storage
      .from('audio_cache')
      .upload(testPath, testContent);

    if (uploadError) {
      await logStorageOperation('test_connection', testPath, 'failed', uploadError);
      return false;
    }

    // Clean up test file
    await supabase.storage
      .from('audio_cache')
      .remove([testPath]);

    await logStorageOperation('test_connection', testPath, 'completed');
    return true;
  } catch (error) {
    console.error('Storage connection test failed:', error);
    await logStorageOperation('test_connection', null, 'failed', error as Error);
    return false;
  }
};
