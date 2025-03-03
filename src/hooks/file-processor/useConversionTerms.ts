
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useConversionTerms = () => {
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const { user } = useAuth();

  const checkTermsAcceptance = useCallback(async (): Promise<boolean> => {
    if (!user) {
      console.log('useConversionTerms - No user, showing terms');
      return false; // No user, always show terms
    }
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('terms_accepted')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('useConversionTerms - Error checking terms acceptance:', error);
        return false;
      }
      
      return data?.terms_accepted === true;
    } catch (err) {
      console.error('useConversionTerms - Error in terms check:', err);
      return false;
    }
  }, [user]);
  
  return {
    showTerms,
    setShowTerms,
    checkTermsAcceptance
  };
};
