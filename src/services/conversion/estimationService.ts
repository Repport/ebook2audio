
// Store performance metrics to improve estimates
let performanceMetrics: {
  averageTimePerCharacter: number;
  lastMeasurements: number[];
  baseLatency: number;
} = {
  averageTimePerCharacter: 0.05, // 50ms per character initial estimate
  lastMeasurements: [],
  baseLatency: 5000, // 5 seconds base latency
};

// Update metrics with new measurements
export const updatePerformanceMetrics = (
  textLength: number,
  executionTime: number
) => {
  const timePerCharacter = executionTime / textLength;
  performanceMetrics.lastMeasurements.push(timePerCharacter);
  
  // Mantener solo las últimas 5 mediciones
  if (performanceMetrics.lastMeasurements.length > 5) {
    performanceMetrics.lastMeasurements.shift();
  }
  
  // Calculate average
  performanceMetrics.averageTimePerCharacter = 
    performanceMetrics.lastMeasurements.reduce((a, b) => a + b, 0) / 
    performanceMetrics.lastMeasurements.length;
    
  console.log('Performance metrics updated:', performanceMetrics);
};

// Calculate estimated time based on text length and chunk size
export const calculateEstimatedTime = (text: string, isCached: boolean = false): number => {
  if (!isCached) {
    return 0; // No simulation for non-cached files
  }

  const characterCount = text.length;
  const CHUNK_SIZE = 4800; // Google TTS API limit
  const numberOfChunks = Math.ceil(characterCount / CHUNK_SIZE);
  const chunkOverhead = numberOfChunks * 2000; // 2 seconds overhead per chunk
  const minProcessingTime = 15000; // Minimum 15 seconds
  
  const estimatedTime = Math.max(
    minProcessingTime,
    Math.ceil(
      (characterCount * performanceMetrics.averageTimePerCharacter) +
      performanceMetrics.baseLatency +
      chunkOverhead
    )
  );
  
  console.log('Estimated time calculation:', {
    characterCount,
    numberOfChunks,
    chunkOverhead,
    averageTimePerCharacter: performanceMetrics.averageTimePerCharacter,
    baseLatency: performanceMetrics.baseLatency,
    estimatedTime,
    minProcessingTime,
    isCached
  });
  
  return estimatedTime;
};
