
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { retryOperation } from '@/services/conversion/utils/retryUtils';

export function useTermsAndNotifications() {
  const { user } = useAuth();
  
  const handleNotificationSetup = useCallback(async (
    notifyOnComplete: boolean, 
    conversionId: string | null
  ) => {
    // Only proceed if notifications are enabled and we have a user and conversion ID
    if (notifyOnComplete && user && conversionId) {
      console.log('useTermsAndNotifications - Setting up notification for conversion completion');
      
      try {
        await retryOperation(async () => {
          return supabase.from('conversion_notifications').insert({
            conversion_id: conversionId,
            user_id: user.id,
            email: user.email,
          });
        }, { maxRetries: 3 });
        
        console.log('useTermsAndNotifications - Notification setup successful');
      } catch (error) {
        console.error('useTermsAndNotifications - Failed to setup notification:', error);
      }
    }
  }, [user]);
  
  return {
    handleNotificationSetup
  };
}
