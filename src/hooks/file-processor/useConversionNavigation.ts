
import { useCallback } from 'react';

export const useConversionNavigation = (navigate: any) => {
  const handleViewConversions = useCallback(() => {
    console.log('useConversionLogic - Navigating to conversions page');
    navigate('/conversions');
  }, [navigate]);
  
  return { handleViewConversions };
};
