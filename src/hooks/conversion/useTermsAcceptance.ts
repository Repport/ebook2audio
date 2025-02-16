
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTermsAcceptance = () => {
  const [showTerms, setShowTerms] = useState(false);

  const checkRecentTermsAcceptance = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('terms_acceptance_logs')
        .select('*')
        .order('accepted_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking terms acceptance:', error);
        setShowTerms(true);
        return false;
      }

      // Si no hay registros o el último registro es de hace más de 24 horas
      if (!data || data.length === 0 || 
          new Date(data[0].accepted_at).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
        console.log('Terms not accepted or expired');
        setShowTerms(true);
        return false;
      }

      console.log('Terms already accepted and valid');
      return true;
    } catch (error) {
      console.error('Error in checkRecentTermsAcceptance:', error);
      setShowTerms(true);
      return false;
    }
  }, []);

  return {
    showTerms,
    setShowTerms,
    checkRecentTermsAcceptance
  };
};
