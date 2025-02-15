
export function calculateSimulatedProgress(
  elapsedTime: number,
  totalChunks: number,
  processedChunks: number,
  realProgress: number
): number {
  // If we have real progress from the server, use it
  if (realProgress > 0) {
    return Math.min(realProgress, 100);
  }

  // If we know the total chunks, use that for progress calculation
  if (totalChunks > 0 && processedChunks > 0) {
    const chunkProgress = (processedChunks / totalChunks) * 85; // Up to 85% for chunks
    return Math.min(chunkProgress + 5, 90); // Start at 5%, cap at 90%
  }

  // Fallback to time-based simulation
  const baseProgress = Math.min(
    (elapsedTime / (totalChunks * 8)) * 100, // Estimate 8 seconds per chunk
    90 // Maximum 90% for simulation
  );

  return Math.min(Math.max(5, baseProgress), 90); // Keep between 5-90%
}
