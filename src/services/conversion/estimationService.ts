
// Almacena las mediciones de rendimiento para mejorar las estimaciones
let performanceMetrics: {
  averageTimePerCharacter: number;
  lastMeasurements: number[];
  baseLatency: number;
} = {
  averageTimePerCharacter: 0.02, // 20ms por carácter como valor inicial
  lastMeasurements: [],
  baseLatency: 2000, // 2 segundos de latencia base inicial
};

// Actualiza las métricas de rendimiento con una nueva medición
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
  
  // Calcular el promedio
  performanceMetrics.averageTimePerCharacter = 
    performanceMetrics.lastMeasurements.reduce((a, b) => a + b, 0) / 
    performanceMetrics.lastMeasurements.length;
    
  console.log('Performance metrics updated:', performanceMetrics);
};

// Calcula el tiempo estimado basado en el texto
export const calculateEstimatedTime = (text: string): number => {
  const characterCount = text.length;
  const chunkOverhead = Math.ceil(characterCount / 4800) * 500; // 500ms de overhead por chunk
  const estimatedTime = Math.ceil(
    (characterCount * performanceMetrics.averageTimePerCharacter) +
    performanceMetrics.baseLatency +
    chunkOverhead
  );
  
  console.log('Estimated time calculation:', {
    characterCount,
    chunkOverhead,
    averageTimePerCharacter: performanceMetrics.averageTimePerCharacter,
    baseLatency: performanceMetrics.baseLatency,
    estimatedTime
  });
  
  return estimatedTime;
};
