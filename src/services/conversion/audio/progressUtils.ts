import { ChunkProgressData } from '../types/chunks';

/**
 * Calculates and formats progress data for reporting
 */
export function calculateProgressData(
  processedChunksCount: number,
  totalChunks: number,
  processedCharacters: number,
  totalCharacters: number,
  currentChunk: string | null,
  instanceId: string
): ChunkProgressData {
  // Ensure we don't exceed total count (can happen with rounding errors)
  const safeProcessedChars = Math.min(processedCharacters, totalCharacters);
  
  // Calculate progress percentage (1-99%)
  const progressPercent = Math.min(
    99, // Cap at 99% until explicitly completed
    Math.max(1, Math.round((safeProcessedChars / totalCharacters) * 1000) / 10)
  );
  
  // Calculate alternative progress based on processed chunks
  const chunkProgress = Math.min(
    99,
    Math.max(1, Math.round((processedChunksCount / totalChunks) * 100))
  );
  
  // Use the most reliable progress metric
  const finalProgress = processedChunksCount > 0 ? chunkProgress : progressPercent;
  
  const progressData: ChunkProgressData = {
    processedChunks: processedChunksCount,
    totalChunks: totalChunks,
    processedCharacters: safeProcessedChars,
    totalCharacters: totalCharacters,
    currentChunk: currentChunk || "",
    progress: finalProgress
  };
  
  console.log(`[ChunkManager-${instanceId}] Progress update:`, {
    progress: `${finalProgress}%`,
    chunks: `${processedChunksCount}/${totalChunks}`,
    characters: `${safeProcessedChars}/${totalCharacters}`
  });
  
  return progressData;
}

/**
 * Saves progress logs to local storage for debugging
 */
export function saveProgressToLocalStorage(progress: number, processedChunks: number, totalChunks: number, 
                                          processedCharacters: number, totalCharacters: number): void {
  try {
    const progressLog = {
      timestamp: new Date().toISOString(),
      progress,
      processedChunks,
      totalChunks,
      processedCharacters,
      totalCharacters,
    };
    
    // Guardar en localStorage para poder revisar logs fácilmente
    const progressLogs = JSON.parse(localStorage.getItem('conversionProgressLogs') || '[]');
    progressLogs.push(progressLog);
    if (progressLogs.length > 100) progressLogs.shift(); // Limite de 100 logs
    localStorage.setItem('conversionProgressLogs', JSON.stringify(progressLogs));
  } catch (e) {
    // Ignorar errores de localStorage
  }
}
