
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useConversionNavigation = () => {
  const navigate = useNavigate();

  const handleViewConversions = useCallback(() => {
    navigate('/conversions');
  }, [navigate]);

  return {
    handleViewConversions
  };
};
