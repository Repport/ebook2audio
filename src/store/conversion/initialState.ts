
import { ConversionState } from './types';

// Estado inicial
export const initialState: ConversionState = {
  status: 'idle',
  progress: 0,
  chunks: {
    processed: 0,
    total: 0,
    processedCharacters: 0,
    totalCharacters: 0
  },
  time: {
    elapsed: 0,
    remaining: null,
    startTime: null
  },
  errors: [],
  warnings: [],
  audioData: null,
  audioDuration: 0,
  conversionId: null,
  fileName: null
};
