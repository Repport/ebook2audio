
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useRecaptchaVerification = () => {
  const { toast } = useToast();

  const verifyRecaptcha = async (token: string) => {
    try {
      console.log('Starting reCAPTCHA verification...');
      
      // First check if reCAPTCHA is enabled
      const { data: configData, error: configError } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'recaptcha_enabled')
        .single();
      
      if (configError) {
        console.error('Error fetching reCAPTCHA config:', configError);
        // Default to enabled if we can't fetch the config
        return await performVerification(token);
      }

      const isEnabled = configData?.value === 'true';
      
      if (!isEnabled) {
        console.log('reCAPTCHA verification bypassed - feature disabled');
        return {
          success: true,
          score: 1,
          action: 'terms_acceptance',
          timestamp: new Date().toISOString()
        };
      }

      return await performVerification(token);
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

  const performVerification = async (token: string) => {
    const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
      body: { 
        token,
        expectedAction: 'terms_acceptance'
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      let errorMessage = 'Failed to verify security check';
      
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
  };

  return { verifyRecaptcha };
};
