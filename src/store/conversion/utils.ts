
/**
 * Calculates the estimated remaining time for conversion
 * @param elapsed Elapsed time in seconds
 * @param progress Current progress percentage (0-100)
 * @param textLength Total text length in characters
 * @returns Estimated remaining time in seconds, or null if not enough data
 */
export const calculateTimeRemaining = (elapsed: number, progress: number, textLength: number): number | null => {
  if (progress < 5 || elapsed < 5) return null;
  
  const progressDecimal = progress / 100;
  if (progressDecimal >= 0.99) return 0;
  
  const timePerPercent = elapsed / progressDecimal;
  const remaining = timePerPercent * (1 - progressDecimal);
  
  // Ajustar basado en longitud del texto (heurística)
  const lengthFactor = Math.max(0.5, Math.min(2, textLength / 50000));
  return Math.round(remaining * lengthFactor);
};
