
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
  // Track previous conversion ID to detect changes
  const prevConversionIdRef = useRef<string | null>(null);
  // Track last update time for throttling
  const lastUpdateTimeRef = useRef(0);
  const UPDATE_THROTTLE_MS = 150;
  
  useEffect(() => {
    // Skip if conversionId is the same as before
    if (conversionId === prevConversionIdRef.current) {
      return;
    }
    
    // Update the reference
    prevConversionIdRef.current = conversionId;
    
    // Reset completion flag when conversion ID changes
    completionCalledRef.current = false;
    
    // Clean up previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
    // If no conversion ID, exit early
    if (!conversionId) {
      setIsSubscribed(false);
      return;
    }
    
    console.log(`Setting up progress subscription for ${conversionId}`);
    
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
    
    // Process updates with throttling
    const processUpdate = (progressData: ChunkProgressData) => {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < UPDATE_THROTTLE_MS) {
        return;
      }
      
      lastUpdateTimeRef.current = now;
      
      updateProgress(progressData);
      
      // Only complete conversion once per subscription
      if (progressData.isCompleted && !completionCalledRef.current) {
        completionCalledRef.current = true;
        completeConversion(null, conversionId, progressData.totalCharacters / 15);
      } else if (progressData.error) {
        setError(progressData.error);
      }
    };
    
    // Subscribe to real-time updates
    const subscription = subscribeToProgress(conversionId, processUpdate);
    
    // Store subscription for cleanup
    subscriptionRef.current = subscription;
    setIsSubscribed(true);
    
    return () => {
      console.log(`Cleaning up progress subscription for ${conversionId}`);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      setIsSubscribed(false);
    };
  }, [conversionId, updateProgress, setError, completeConversion]);
  
  return { isSubscribed };
};
