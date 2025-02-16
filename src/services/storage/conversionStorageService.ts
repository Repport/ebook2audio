import { supabase } from "@/integrations/supabase/client";

interface StoredConversionState {
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  audioData?: string; // base64
  audioDuration: number;
  fileName?: string;
  conversionId?: string;
}

const CHUNK_SIZE = 500000; // 500KB chunks

export const saveConversionState = async (state: StoredConversionState) => {
  try {
    // Si hay un ID de conversión, actualizar en Supabase
    if (state.conversionId) {
      const { data: existingConversion, error } = await supabase
        .from('text_conversions')
        .select('text_hash, status')
        .eq('id', state.conversionId)
        .maybeSingle();

      if (error) {
        console.error('Error al verificar la conversión:', error);
        return;
      }

      // Solo actualizamos si:
      // 1. La conversión existe
      // 2. No estamos intentando cambiar una conversión completada a otro estado
      if (existingConversion?.text_hash && 
          !(existingConversion.status === 'completed' && state.status !== 'completed')) {
        
        console.log('🔄 Actualizando estado de conversión:', {
          id: state.conversionId,
          status: state.status,
          progress: state.progress,
          fileName: state.fileName
        });

        const { error: updateError } = await supabase
          .from('text_conversions')
          .update({
            status: state.status,
            progress: state.progress,
            file_name: state.fileName,
          })
          .eq('id', state.conversionId);

        if (updateError) {
          console.error('❌ Error al actualizar la conversión:', updateError);
        }
      } else {
        console.warn('⚠️ No se actualizó la conversión:', {
          reason: existingConversion ? 'conversión ya completada' : 'text_hash no encontrado',
          conversionId: state.conversionId
        });
      }
    }

    // Si hay datos de audio, los almacenamos en chunks en sessionStorage
    if (state.audioData) {
      const chunks = Math.ceil(state.audioData.length / CHUNK_SIZE);
      sessionStorage.setItem('conversionState_chunks', chunks.toString());
      
      // Almacenar cada chunk por separado
      for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = start + CHUNK_SIZE;
        const chunk = state.audioData.slice(start, end);
        sessionStorage.setItem(`conversionState_chunk_${i}`, chunk);
      }
      
      // Almacenar el estado principal sin los datos de audio
      const stateWithoutAudio = { ...state, audioData: undefined };
      sessionStorage.setItem('conversionState', JSON.stringify(stateWithoutAudio));
    } else {
      // Si no hay datos de audio, almacenar el estado normalmente
      sessionStorage.setItem('conversionState', JSON.stringify(state));
    }
  } catch (error) {
    console.error('❌ Error saving conversion state:', error);
    clearConversionStorage();
  }
};

export const loadConversionState = async (): Promise<StoredConversionState | null> => {
  try {
    // Primero intentar cargar desde sessionStorage
    const stored = sessionStorage.getItem('conversionState');
    if (!stored) return null;
    
    const state = JSON.parse(stored);
    
    // Si hay un ID de conversión, obtener el estado más reciente de Supabase
    if (state.conversionId) {
      const { data: conversionData, error } = await supabase
        .from('text_conversions')
        .select('*')
        .eq('id', state.conversionId)
        .maybeSingle();

      if (!error && conversionData) {
        state.status = conversionData.status;
        state.progress = conversionData.progress;
      }
    }

    // Reconstruir datos de audio desde chunks si existen
    const chunks = parseInt(sessionStorage.getItem('conversionState_chunks') || '0');
    if (chunks > 0) {
      let audioData = '';
      for (let i = 0; i < chunks; i++) {
        const chunk = sessionStorage.getItem(`conversionState_chunk_${i}`);
        if (chunk) {
          audioData += chunk;
        }
      }
      state.audioData = audioData;
    }
    
    return state;
  } catch (error) {
    console.error('❌ Error loading conversion state:', error);
    clearConversionStorage();
    return null;
  }
};

export const clearConversionStorage = () => {
  // Obtener todas las claves en sessionStorage
  const keys = Object.keys(sessionStorage);
  
  // Eliminar todos los elementos relacionados con la conversión
  keys.forEach(key => {
    if (key.startsWith('conversionState')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const convertArrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const convertBase64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};
