
type ProgressCache = {
  processedCharacters: number;
  totalCharacters: number;
  startTime: number;
  lastUpdate: number;
  speed: number;
  recentSpeeds: number[];
};

const progressCache = new Map<string, ProgressCache>();

export const initializeProgress = (conversionId: string, totalCharacters: number) => {
  progressCache.set(conversionId, {
    processedCharacters: 0,
    totalCharacters,
    startTime: Date.now(),
    lastUpdate: Date.now(),
    speed: 0,
    recentSpeeds: []
  });
  console.log('🏁 Initialized progress cache for:', conversionId);
};

export const updateProgress = (conversionId: string, newProcessedCharacters: number) => {
  const cache = progressCache.get(conversionId);
  if (!cache) {
    console.warn('⚠️ No cache found for conversion:', conversionId);
    return null;
  }

  const now = Date.now();
  const timeSinceLastUpdate = (now - cache.lastUpdate) / 1000; // en segundos
  const charactersDelta = newProcessedCharacters - cache.processedCharacters;
  
  if (timeSinceLastUpdate > 0 && charactersDelta > 0) {
    const currentSpeed = charactersDelta / timeSinceLastUpdate;
    cache.recentSpeeds.push(currentSpeed);
    
    // Mantener solo las últimas 5 mediciones
    if (cache.recentSpeeds.length > 5) {
      cache.recentSpeeds.shift();
    }
    
    // Calcular velocidad promedio
    cache.speed = cache.recentSpeeds.reduce((a, b) => a + b, 0) / cache.recentSpeeds.length;
  }

  cache.processedCharacters = newProcessedCharacters;
  cache.lastUpdate = now;
  progressCache.set(conversionId, cache);

  const progress = Math.min(Math.round((newProcessedCharacters / cache.totalCharacters) * 100), 99);
  const remainingCharacters = cache.totalCharacters - newProcessedCharacters;
  const estimatedSeconds = cache.speed > 0 ? Math.ceil(remainingCharacters / cache.speed) : null;
  const elapsedSeconds = Math.floor((now - cache.startTime) / 1000);

  console.log('📊 Progress update:', {
    conversionId,
    progress,
    processedCharacters: newProcessedCharacters,
    totalCharacters: cache.totalCharacters,
    speed: `${cache.speed.toFixed(1)} chars/sec`,
    estimatedSeconds,
    elapsedSeconds
  });

  return {
    progress,
    processedCharacters: newProcessedCharacters,
    totalCharacters: cache.totalCharacters,
    speed: cache.speed,
    estimatedSeconds,
    elapsedSeconds
  };
};

export const getProgress = (conversionId: string) => {
  return progressCache.get(conversionId);
};

export const clearProgress = (conversionId: string) => {
  progressCache.delete(conversionId);
  console.log('🧹 Cleared progress cache for:', conversionId);
};
