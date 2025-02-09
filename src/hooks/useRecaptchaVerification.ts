
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useRecaptchaVerification = () => {
  const { toast } = useToast();

  const verifyRecaptcha = async (token: string) => {
    try {
      console.log('Starting reCAPTCHA verification...');
      
      const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
        body: { 
          token,
          expectedAction: 'terms_acceptance'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        let errorMessage = 'Failed to verify security check';
        
        // Try to parse the error message from the response
        try {
          const responseBody = JSON.parse(error.message);
          if (responseBody?.error) {
            errorMessage = responseBody.error;
          }
        } catch (e) {
          console.error('Error parsing error message:', e);
        }
        
        toast({
          title: "Verification Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return null;
      }

      console.log('Verification result:', data);
      return data;
    } catch (error) {
      console.error('Error in verifyRecaptcha:', error);
      toast({
        title: "Verification Failed",
        description: "An unexpected error occurred during verification. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  return { verifyRecaptcha };
};
