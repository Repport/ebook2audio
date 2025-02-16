
export function calculateSimulatedProgress(
  elapsedTime: number,
  totalChunks: number,
  processedChunks: number,
  realProgress: number
): number {
  if (realProgress > 0) return Math.min(realProgress, 100);

  if (totalChunks > 0 && processedChunks > 0) {
    const chunkProgress = (processedChunks / totalChunks) * 90;
    const timeBasedProgress = Math.min((elapsedTime / (totalChunks * 5)) * 100, 95);
    return Math.max(chunkProgress, timeBasedProgress);
  }

  return Math.min(elapsedTime * 0.5, 95);
}
