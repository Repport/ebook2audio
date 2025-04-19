
import { supabase } from "@/integrations/supabase/client";
import { DatabaseLogEntry } from '@/utils/logging/types';

export class ConversionService {
  /**
   * Inicia una nueva conversión
   */
  static async createConversion(textHash: string, fileName?: string, userId?: string) {
    const { data, error } = await supabase
      .from('text_conversions')
      .insert({
        text_hash: textHash,
        file_name: fileName,
        user_id: userId,
        status: 'pending',
        progress: 0
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Actualiza el estado de una conversión
   */
  static async updateConversionStatus(
    conversionId: string,
    status: 'pending' | 'processing' | 'completed' | 'error',
    progress: number
  ) {
    const { error } = await supabase
      .from('text_conversions')
      .update({
        status,
        progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversionId);

    if (error) throw error;
  }

  /**
   * Obtiene el estado actual de una conversión
   */
  static async getConversionStatus(conversionId: string) {
    const { data, error } = await supabase
      .from('text_conversions')
      .select('*')
      .eq('id', conversionId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}
