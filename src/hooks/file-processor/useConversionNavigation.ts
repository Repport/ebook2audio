
import { useCallback } from 'react';
import { NavigateFunction } from 'react-router-dom';

export const useConversionNavigation = (navigate: NavigateFunction) => {
  const handleViewConversions = useCallback(() => {
    console.log('useConversionNavigation - Navigating to conversions');
    navigate('/conversions');
  }, [navigate]);
  
  const handleTabChange = useCallback((tab: string) => {
    console.log(`useConversionNavigation - Changing tab to: ${tab}`);
    // This function now merely passes the tab value through
    // We're intentionally not using navigate() here to prevent page refreshes
    return tab;
  }, []);
  
  return { 
    handleViewConversions,
    handleTabChange
  };
};
