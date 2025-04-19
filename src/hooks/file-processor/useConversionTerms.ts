
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
        .from('user_consents')
        .select('id, accepted_at')
        .eq('terms_accepted', true)
        .order('accepted_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error checking terms acceptance:', error);
        return false; // If error, require terms acceptance to be safe
      }
      
      if (data && data.length > 0 && data[0].accepted_at) {
        const lastAcceptance = new Date(data[0].accepted_at);
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

  // Define a separate constant for the export instead of using export modifier
  const termsAcceptanceHook = useConversionTerms;

  return {
    showTerms,
    setShowTerms,
    checkTermsAcceptance
  };
}

// Export the hook separately
export const useTermsAcceptance = useConversionTerms;

export default useConversionTerms;
