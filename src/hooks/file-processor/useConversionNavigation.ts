
import { useCallback } from 'react';
import { NavigateFunction } from 'react-router-dom';

export const useConversionNavigation = (navigate: NavigateFunction) => {
  const handleViewConversions = useCallback(() => {
    console.log('useConversionNavigation - Navigating to conversions');
    navigate('/conversions');
  }, [navigate]);
  
  const handleTabChange = useCallback((tab: string) => {
    console.log(`useConversionNavigation - Changing tab to: ${tab}`);
    // Use a state update instead of navigation to prevent page refresh
    return tab;
  }, []);
  
  return { 
    handleViewConversions,
    handleTabChange
  };
};
