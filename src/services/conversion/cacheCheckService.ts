
import { supabase } from '@/integrations/supabase/client';
import { fetchFromCache } from './cacheService';

export async function checkExistingConversion(textHash: string) {
  console.log('Checking for existing conversion with hash:', textHash);
  
  const { data: existingConversion, error } = await supabase
    .from('text_conversions')
    .select('*')
    .eq('text_hash', textHash)
    .eq('status', 'completed')
    .maybeSingle();

  if (error) {
    console.error('Error checking existing conversion:', error);
    return null;
  }

  if (existingConversion?.storage_path) {
    console.log('Found existing conversion:', existingConversion);
    const { data: audioBuffer, error: fetchError } = await fetchFromCache(existingConversion.storage_path);
    
    if (fetchError) {
      console.error('Error fetching cached audio:', fetchError);
      return null;
    }

    return {
      conversion: existingConversion,
      audioBuffer
    };
  }

  return null;
}
