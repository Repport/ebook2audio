
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversionService } from '@/features/conversion/services/ConversionService';
import { ConversionRequest } from '@/core/types';
import { createMockFile, createMockArrayBuffer } from '@/shared/utils/testing';

// Mock del servicio de conversión de audio
vi.mock('@/services/conversion/audio/conversionService', () => ({
  convertTextToAudio: vi.fn()
}));

describe('ConversionService', () => {
  const mockConvertTextToAudio = vi.mocked(
    require('@/services/conversion/audio/conversionService').convertTextToAudio
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convert', () => {
    const validRequest: ConversionRequest = {
      id: 'test-conversion-id',
      text: 'This is a test text for conversion.',
      voiceId: 'test-voice-id',
      fileName: 'test.txt'
    };

    it('should convert text to audio successfully', async () => {
      const mockAudio = createMockArrayBuffer(1024);
      mockConvertTextToAudio.mockResolvedValue({
        audio: mockAudio,
        id: 'audio-result-id'
      });

      const result = await ConversionService.convert(validRequest);

      expect(result).toMatchObject({
        id: 'audio-result-id',
        audio: mockAudio,
        duration: expect.any(Number),
        metadata: expect.objectContaining({
          totalChunks: expect.any(Number),
          processedChunks: expect.any(Number),
          processingTime: expect.any(Number),
          audioSize: 1024
        })
      });
    });

    it('should call progress callback during conversion', async () => {
      const mockAudio = createMockArrayBuffer(1024);
      const progressCallback = vi.fn();
      
      mockConvertTextToAudio.mockImplementation(async (text, voiceId, onProgress) => {
        // Simular progreso
        onProgress?.({
          processedChunks: 1,
          totalChunks: 2,
          processedCharacters: 50,
          totalCharacters: 100,
          progress: 50
        });
        
        return { audio: mockAudio, id: 'test-id' };
      });

      await ConversionService.convert(validRequest, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          conversionId: validRequest.id,
          progress: 50,
          processedChunks: 1,
          totalChunks: 2
        })
      );
    });

    it('should handle conversion errors', async () => {
      const conversionError = new Error('Conversion failed');
      mockConvertTextToAudio.mockRejectedValue(conversionError);

      await expect(ConversionService.convert(validRequest)).rejects.toThrow('Conversion failed');
    });
  });

  describe('validateRequest', () => {
    it('should validate a valid request', () => {
      const validRequest: ConversionRequest = {
        id: 'test-id',
        text: 'Valid text',
        voiceId: 'voice-id'
      };

      expect(() => ConversionService.validateRequest(validRequest)).not.toThrow();
    });

    it('should reject request without ID', () => {
      const invalidRequest = {
        text: 'Valid text',
        voiceId: 'voice-id'
      } as ConversionRequest;

      expect(() => ConversionService.validateRequest(invalidRequest))
        .toThrow('Conversion request must have an ID');
    });

    it('should reject request without text', () => {
      const invalidRequest: ConversionRequest = {
        id: 'test-id',
        text: '',
        voiceId: 'voice-id'
      };

      expect(() => ConversionService.validateRequest(invalidRequest))
        .toThrow('Conversion request must have non-empty text');
    });

    it('should reject request with text too long', () => {
      const invalidRequest: ConversionRequest = {
        id: 'test-id',
        text: 'a'.repeat(600000), // Más de 500KB
        voiceId: 'voice-id'
      };

      expect(() => ConversionService.validateRequest(invalidRequest))
        .toThrow('Text too long for conversion');
    });
  });
});
