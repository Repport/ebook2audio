
export function calculateSimulatedProgress(
  elapsedTime: number,
  totalChunks: number,
  processedChunks: number,
  realProgress: number
): number {
  // Si tenemos progreso real del servidor, lo usamos
  if (realProgress > 0) {
    return Math.min(realProgress, 100);
  }

  // Si conocemos los chunks totales, usamos eso para el cálculo del progreso
  if (totalChunks > 0 && processedChunks > 0) {
    const chunkProgress = (processedChunks / totalChunks) * 85; // Hasta 85% para chunks
    return Math.min(chunkProgress + 5, 90); // Comenzar en 5%, máximo 90%
  }

  // Fallback a simulación basada en tiempo
  const estimatedTotalTime = totalChunks > 0 ? totalChunks * 10 : 60; // 10s por chunk o 60s total
  const simulatedProgress = Math.min(
    (elapsedTime / estimatedTotalTime) * 100,
    90 // Máximo 90% para simulación
  );

  console.log('🔄 Simulated progress calculation:', {
    elapsedTime: `${elapsedTime}s`,
    estimatedTotalTime: `${estimatedTotalTime}s`,
    simulatedProgress: `${simulatedProgress.toFixed(1)}%`,
    totalChunks,
    processedChunks
  });

  return Math.min(Math.max(5, simulatedProgress), 90); // Mantener entre 5-90%
}
