
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTermsAcceptance = () => {
  const [showTerms, setShowTerms] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const checkRecentTermsAcceptance = useCallback(async () => {
    try {
      console.log('Checking recent terms acceptance...');
      
      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('terms_accepted', true)
        .order('accepted_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking terms acceptance:', error);
        setHasAcceptedTerms(false);
        return false;
      }

      // If no records or last acceptance is more than 24 hours ago
      if (!data || data.length === 0 || 
          !data[0].accepted_at || 
          (new Date(data[0].accepted_at).getTime() < Date.now() - 24 * 60 * 60 * 1000)) {
        console.log('No recent terms acceptance found');
        setHasAcceptedTerms(false);
        return false;
      }

      console.log('Found recent terms acceptance:', data[0]);
      setHasAcceptedTerms(true);
      return true;
    } catch (error) {
      console.error('Error in checkRecentTermsAcceptance:', error);
      setHasAcceptedTerms(false);
      return false;
    }
  }, []);

  return {
    showTerms,
    setShowTerms,
    hasAcceptedTerms,
    setHasAcceptedTerms,
    checkRecentTermsAcceptance
  };
};
