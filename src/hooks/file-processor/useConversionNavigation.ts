
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useConversionNavigation() {
  const navigate = useNavigate();
  
  const handleViewConversions = useCallback(() => {
    navigate('/conversions');
  }, [navigate]);
  
  return {
    handleViewConversions
  };
}

// Export alias for compatibility with the old name
export const useNavigationHandlers = useConversionNavigation;
