
import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "./utils";

export async function createConversion(
  textHash: string, 
  fileName: string | undefined, 
  userId: string | undefined
): Promise<string> {
  // Check if conversion record already exists
  const { data: existingConversions, error: existingError } = await supabase
    .from('text_conversions')
    .select()
    .eq('text_hash', textHash)
    .order('created_at', { ascending: false })
    .limit(1);

  if (existingError) {
    throw existingError;
  }

  if (existingConversions && existingConversions.length > 0) {
    return existingConversions[0].id;
  }

  // Create new conversion record
  const { data: newConversion, error: insertError } = await supabase
    .from('text_conversions')
    .insert({
      text_hash: textHash,
      file_name: fileName,
      user_id: userId,
    })
    .select()
    .single();
  
  if (insertError) throw insertError;
  if (!newConversion) throw new Error('Failed to create conversion record');
  
  return newConversion.id;
}

