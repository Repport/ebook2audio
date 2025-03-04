
import { useState, useEffect, useRef } from 'react';
import { useConversionStore } from '@/store/conversionStore';
import { subscribeToProgress, getConversionProgress } from '@/services/conversion/progressService';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const useConversionProgress = (conversionId: string | null) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const updateProgress = useConversionStore(state => state.updateProgress);
  const setError = useConversionStore(state => state.setError);
  const completeConversion = useConversionStore(state => state.completeConversion);
  
  // Track if completion has been called for this conversion
  const completionCalledRef = useRef(false);
  // Track current subscription for cleanup
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  
  useEffect(() => {
    // Reset completion flag when conversion ID changes
    completionCalledRef.current = false;
    
    // Clean up previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
    if (!conversionId) {
      setIsSubscribed(false);
      return;
    }
    
    // Get initial progress
    const fetchInitialProgress = async () => {
      try {
        const progress = await getConversionProgress(conversionId);
        if (progress) {
          updateProgress(progress);
          
          // If the progress shows completed or error, update the store accordingly
          if (progress.isCompleted && !completionCalledRef.current) {
            completionCalledRef.current = true;
            completeConversion(null, conversionId, progress.totalCharacters / 15);
          } else if (progress.error) {
            setError(progress.error);
          }
        }
      } catch (error) {
        console.error('Error fetching initial progress:', error);
      }
    };
    
    fetchInitialProgress();
    
    // Subscribe to real-time updates
    const subscription = subscribeToProgress(conversionId, (progressData) => {
      console.log('Received progress update via subscription:', progressData);
      updateProgress(progressData);
      
      // Only complete conversion once per subscription
      if (progressData.isCompleted && !completionCalledRef.current) {
        completionCalledRef.current = true;
        completeConversion(null, conversionId, progressData.totalCharacters / 15);
      } else if (progressData.error) {
        setError(progressData.error);
      }
    });
    
    // Store subscription for cleanup
    subscriptionRef.current = subscription;
    setIsSubscribed(true);
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      setIsSubscribed(false);
    };
  }, [conversionId, updateProgress, setError, completeConversion]);
  
  return { isSubscribed };
};
