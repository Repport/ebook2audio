
import { ConversionRequest, ConversionResult, ProcessingProgress } from '@/core/types';
import { logger } from '@/shared/logging';
import { convertTextToAudio } from '@/services/conversion/audio/conversionService';

export class ConversionService {
  /**
   * Convierte texto a audio
   */
  static async convert(
    request: ConversionRequest,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<ConversionResult> {
    logger.info('conversion', `Starting conversion for request ${request.id}`, {
      textLength: request.text.length,
      voiceId: request.voiceId
    });

    const startTime = Date.now();

    try {
      // Crear callback de progreso que actualiza el estado
      const progressCallback = (progressData: any) => {
        const progress: ProcessingProgress = {
          conversionId: request.id,
          processedChunks: progressData.processedChunks || 0,
          totalChunks: progressData.totalChunks || 0,
          processedCharacters: progressData.processedCharacters || 0,
          totalCharacters: progressData.totalCharacters || request.text.length,
          progress: progressData.progress || 0,
          currentChunk: progressData.currentChunk,
          error: progressData.error,
          warning: progressData.warning,
          isCompleted: progressData.isCompleted
        };

        onProgress?.(progress);
      };

      // Llamar al servicio de conversión existente
      const { audio, id } = await convertTextToAudio(
        request.text,
        request.voiceId,
        progressCallback
      );

      const processingTime = Date.now() - startTime;

      const result: ConversionResult = {
        id,
        audio,
        duration: this.estimateAudioDuration(request.text),
        metadata: {
          totalChunks: Math.ceil(request.text.length / 4800), // Chunk size estimado
          processedChunks: Math.ceil(request.text.length / 4800),
          processingTime,
          audioSize: audio.byteLength
        }
      };

      logger.info('conversion', `Conversion completed for request ${request.id}`, {
        processingTime,
        audioSize: audio.byteLength,
        duration: result.duration
      });

      return result;

    } catch (error) {
      logger.error('conversion', `Conversion failed for request ${request.id}`, {
        error: error instanceof Error ? error.message : String(error),
        processingTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Estima la duración del audio basada en el texto
   */
  private static estimateAudioDuration(text: string): number {
    // Estimación: ~150 palabras por minuto
    const words = text.split(/\s+/).length;
    return Math.ceil((words / 150) * 60);
  }

  /**
   * Valida una solicitud de conversión
   */
  static validateRequest(request: ConversionRequest): void {
    if (!request.id) {
      throw new Error('Conversion request must have an ID');
    }
    if (!request.text || request.text.trim().length === 0) {
      throw new Error('Conversion request must have non-empty text');
    }
    if (!request.voiceId) {
      throw new Error('Conversion request must have a voice ID');
    }
    if (request.text.length > 500000) { // 500KB limit
      throw new Error('Text too long for conversion');
    }
  }
}
