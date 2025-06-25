
import { useState, useCallback } from 'react';

export const useTermsAndNotifications = () => {
  const [showTerms, setShowTerms] = useState(false);

  const checkTermsAcceptance = useCallback(async (): Promise<boolean> => {
    // Simplified check - in real app this would check user's terms acceptance status
    const lastAcceptance = localStorage.getItem('terms_last_accepted');
    if (!lastAcceptance) {
      return false;
    }
    
    const lastAcceptanceDate = new Date(lastAcceptance);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return lastAcceptanceDate > thirtyDaysAgo;
  }, []);

  const acceptTerms = useCallback(() => {
    localStorage.setItem('terms_last_accepted', new Date().toISOString());
    setShowTerms(false);
  }, []);

  return {
    showTerms,
    setShowTerms,
    checkTermsAcceptance,
    acceptTerms
  };
};
