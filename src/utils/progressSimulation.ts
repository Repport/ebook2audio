
export function calculateSimulatedProgress(
  elapsedTime: number,
  totalChunks: number,
  processedChunks: number,
  realProgress: number
): number {
  // Si tenemos progreso real, lo usamos como base
  if (realProgress > 0) {
    return realProgress;
  }

  // Simulación basada en tiempo transcurrido
  const baseProgress = Math.min(
    (elapsedTime / (totalChunks * 6)) * 100, // 6 segundos por chunk estimados
    90 // Máximo 90% para simulación
  );

  // Si tenemos chunks procesados, ajustamos la simulación
  if (processedChunks > 0 && totalChunks > 0) {
    const chunkProgress = (processedChunks / totalChunks) * 100;
    return Math.max(baseProgress, chunkProgress);
  }

  return Math.min(Math.max(0, baseProgress), 100);
}
