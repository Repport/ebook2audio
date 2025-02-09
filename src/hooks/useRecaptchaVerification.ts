
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useRecaptchaVerification = () => {
  const { toast } = useToast();

  const verifyRecaptcha = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token, expectedAction: 'terms_acceptance' }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error verifying reCAPTCHA:', error);
      toast({
        title: "Verification Failed",
        description: "Could not verify security check. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  return { verifyRecaptcha };
};
