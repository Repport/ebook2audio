
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useConversionTerms() {
  const [showTerms, setShowTerms] = useState(false);

  const checkTermsAcceptance = useCallback(async () => {
    try {
      // Check if we have accepted terms recently (last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const { data, error } = await supabase
        .from('terms_acceptance_logs')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error checking terms acceptance:', error);
        return false; // If error, require terms acceptance to be safe
      }
      
      if (data && data.length > 0) {
        const lastAcceptance = new Date(data[0].created_at);
        if (lastAcceptance > twentyFourHoursAgo) {
          console.log('Terms were recently accepted:', lastAcceptance);
          return true; // Terms were accepted within the last 24 hours
        }
      }
      
      // No recent acceptance found
      return false;
    } catch (err) {
      console.error('Error in checkTermsAcceptance:', err);
      return false; // Require terms acceptance if there's an error
    }
  }, []);

  return {
    showTerms,
    setShowTerms,
    checkTermsAcceptance
  };
}
