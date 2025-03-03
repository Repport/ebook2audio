
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useConversionTerms = () => {
  const [showTerms, setShowTerms] = useState(false);
  
  const checkTermsAcceptance = useCallback(async () => {
    // For debugging purposes, we'll assume terms are accepted
    // In production this would check the database
    
    /*
    Try {
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

      // If no records or last record is older than 24 hours
      if (!data || data.length === 0 || 
          new Date(data[0].accepted_at).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
        console.log('Need to show terms');
        setShowTerms(true);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error in terms acceptance check:', err);
      setShowTerms(true);
      return false;
    }
    */
    
    return true;
  }, []);
  
  return {
    showTerms,
    setShowTerms,
    checkTermsAcceptance
  };
};
