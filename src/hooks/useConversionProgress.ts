
import { useState, useEffect } from 'react';
import { useConversionStore } from '@/store/conversionStore';
import { subscribeToProgress, getConversionProgress } from '@/services/conversion/progressService';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const useConversionProgress = (conversionId: string | null) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const updateProgress = useConversionStore(state => state.updateProgress);
  const setError = useConversionStore(state => state.setError);
  const completeConversion = useConversionStore(state => state.completeConversion);
  
  useEffect(() => {
    if (!conversionId) return;
    
    // Get initial progress
    const fetchInitialProgress = async () => {
      const progress = await getConversionProgress(conversionId);
      if (progress) {
        updateProgress(progress);
        
        // If the progress shows completed or error, update the store accordingly
        if (progress.isCompleted) {
          // We don't have the audio data here, but we can mark the conversion as completed
          // The audio data will need to be fetched separately
          completeConversion(null, conversionId, progress.totalCharacters / 15);
        } else if (progress.error) {
          setError(progress.error);
        }
      }
    };
    
    fetchInitialProgress();
    
    // Subscribe to real-time updates
    const subscription = subscribeToProgress(conversionId, (progressData) => {
      console.log('Received progress update via subscription:', progressData);
      updateProgress(progressData);
      
      if (progressData.isCompleted) {
        completeConversion(null, conversionId, progressData.totalCharacters / 15);
      } else if (progressData.error) {
        setError(progressData.error);
      }
    });
    
    setIsSubscribed(true);
    
    return () => {
      subscription.unsubscribe();
      setIsSubscribed(false);
    };
  }, [conversionId, updateProgress, setError, completeConversion]);
  
  return { isSubscribed };
};
