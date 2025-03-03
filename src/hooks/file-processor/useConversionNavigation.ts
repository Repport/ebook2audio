
import { useCallback } from 'react';
import { NavigateFunction } from 'react-router-dom';

export const useConversionNavigation = (navigate: NavigateFunction) => {
  const handleViewConversions = useCallback(() => {
    console.log('useConversionNavigation - Navigating to conversions');
    navigate('/conversions');
  }, [navigate]);
  
  return { handleViewConversions };
};
