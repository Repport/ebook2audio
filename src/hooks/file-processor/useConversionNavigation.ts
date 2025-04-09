
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useConversionNavigation(navigate?: any) {
  const nav = useNavigate();
  
  const handleViewConversions = useCallback(() => {
    if (typeof navigate === 'function') {
      navigate('/conversions');
    } else {
      nav('/conversions');
    }
  }, [navigate, nav]);
  
  return {
    handleViewConversions
  };
}
