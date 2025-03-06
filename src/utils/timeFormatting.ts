
/**
 * Formats a time value in seconds to a human-readable string
 * @param seconds Time in seconds
 * @returns Formatted time string
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return "";
  }
  
  // Round to nearest second
  const roundedSeconds = Math.round(seconds);
  
  if (roundedSeconds < 60) {
    return `${roundedSeconds} sec`;
  } else if (roundedSeconds < 3600) {
    const minutes = Math.floor(roundedSeconds / 60);
    const remainingSeconds = roundedSeconds % 60;
    
    if (remainingSeconds === 0) {
      return `${minutes} min`;
    }
    return `${minutes} min ${remainingSeconds} sec`;
  } else {
    const hours = Math.floor(roundedSeconds / 3600);
    const minutes = Math.floor((roundedSeconds % 3600) / 60);
    
    if (minutes === 0) {
      return `${hours} hr`;
    }
    return `${hours} hr ${minutes} min`;
  }
}

/**
 * Formats a timestamp in seconds to a readable MM:SS or HH:MM:SS format
 * @param seconds Time in seconds
 * @returns Formatted timestamp string
 */
export function formatTimestamp(seconds: number): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return "00:00";
  }
  
  // Round to nearest second
  const roundedSeconds = Math.round(seconds);
  
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const secs = roundedSeconds % 60;
  
  // Format with leading zeros
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = secs.toString().padStart(2, '0');
  
  // Include hours only if there are any
  if (hours > 0) {
    const formattedHours = hours.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
  
  return `${formattedMinutes}:${formattedSeconds}`;
}
