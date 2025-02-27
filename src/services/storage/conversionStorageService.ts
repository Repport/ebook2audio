
import { supabase } from "@/integrations/supabase/client";

interface StoredConversionState {
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  audioData?: string; // base64
  audioDuration: number;
  fileName?: string;
  conversionId?: string;
  conversionStartTime?: number; // Nuevo: timestamp cuando empezó la conversión
  elapsedTime?: number; // Nuevo: tiempo transcurrido en segundos
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
          fileName: state.fileName,
          elapsedTime: state.elapsedTime
        });

        const updateData: any = {
          status: state.status,
          progress: state.progress,
          file_name: state.fileName,
        };

        // Solo actualizamos el tiempo si está definido
        if (state.elapsedTime !== undefined) {
          updateData.elapsed_time = state.elapsedTime;
        }

        // Si estamos iniciando la conversión, guardamos el tiempo de inicio
        if (state.status === 'converting' && state.conversionStartTime) {
          updateData.started_at = new Date(state.conversionStartTime).toISOString();
        }

        const { error: updateError } = await supabase
          .from('text_conversions')
          .update(updateData)
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
    if (!stored) {
      console.log('No hay estado guardado en sessionStorage');
      return null;
    }
    
    const state = JSON.parse(stored);
    
    // Si hay un ID de conversión, obtener el estado más reciente de Supabase
    if (state.conversionId) {
      console.log('🔍 Buscando conversión en Supabase:', state.conversionId);
      
      const { data: conversionData, error } = await supabase
        .from('text_conversions')
        .select('status, progress, storage_path, started_at, elapsed_time')
        .eq('id', state.conversionId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error al cargar estado de conversión:', error);
        return state;
      }

      if (conversionData) {
        console.log('✅ Estado de conversión encontrado:', conversionData);
        
        // Solo actualizar el estado si la conversión está realmente completada
        // y tiene una ruta de almacenamiento válida
        if (conversionData.status === 'completed' && !conversionData.storage_path) {
          console.warn('⚠️ Conversión marcada como completada pero sin audio, reseteando estado');
          state.status = 'converting';
          state.progress = 0;
        } else {
          state.status = conversionData.status;
          state.progress = conversionData.progress;
          
          // Calcular el tiempo transcurrido
          if (conversionData.elapsed_time) {
            // Si hay tiempo guardado, usarlo directamente
            state.elapsedTime = conversionData.elapsed_time;
          } else if (conversionData.started_at && conversionData.status === 'converting') {
            // Si está en progreso y tenemos tiempo de inicio, calcular
            const startTime = new Date(conversionData.started_at).getTime();
            state.conversionStartTime = startTime;
            state.elapsedTime = Math.floor((Date.now() - startTime) / 1000);
          }
        }
      } else {
        console.warn('⚠️ No se encontró la conversión:', state.conversionId);
        // Si no encontramos la conversión, resetear el estado
        state.status = 'idle';
        state.progress = 0;
        state.conversionId = undefined;
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
    
    console.log('Estado final cargado:', {
      status: state.status,
      progress: state.progress,
      hasAudio: !!state.audioData,
      conversionId: state.conversionId,
      elapsedTime: state.elapsedTime
    });
    
    return state;
  } catch (error) {
    console.error('❌ Error loading conversion state:', error);
    clearConversionStorage();
    return null;
  }
};

export const clearConversionStorage = () => {
  console.log('🧹 Limpiando estado de conversión del sessionStorage');
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
