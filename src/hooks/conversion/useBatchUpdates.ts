
import { useEffect } from 'react';

export const useBatchUpdates = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  updateProgressInBatches: () => Promise<void>
) => {
  useEffect(() => {
    if (status === 'converting' || status === 'processing') {
      const interval = setInterval(updateProgressInBatches, 5000);
      return () => clearInterval(interval);
    }
  }, [status, updateProgressInBatches]);
};
