
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { retryOperation } from '@/services/conversion/utils/retryUtils';

export function useTermsAndNotifications() {
  const [showTerms, setShowTerms] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const handleNotificationSetup = useCallback(async (notifyOnComplete: boolean, conversionId: string) => {
    if (!notifyOnComplete || !user || !conversionId) {
      return;
    }
    
    try {
      const notificationResult = await retryOperation(async () => {
        return supabase.from('conversion_notifications').insert({
          conversion_id: conversionId,
          user_id: user.id,
          email: user.email,
        });
      }, { maxRetries: 3 });

      if (notificationResult.error) {
        console.error('Error creating notification:', notificationResult.error);
        toast({
          title: "Notification Error",
          description: "Could not set up email notification. Please try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Notification Set",
          description: "You'll receive an email when your conversion is ready!",
        });
      }
    } catch (error) {
      console.error('Error setting up notification:', error);
    }
  }, [user, toast]);
  
  return {
    showTerms,
    setShowTerms,
    hasAcceptedTerms,
    setHasAcceptedTerms,
    handleNotificationSetup
  };
}
