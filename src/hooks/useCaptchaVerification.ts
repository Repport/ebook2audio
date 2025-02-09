
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useCaptchaVerification = () => {
  const { toast } = useToast();

  const verifyCaptcha = async (token: string) => {
    try {
      console.log('Starting hCaptcha verification...');
      
      const { data: configData, error: configError } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'hcaptcha_enabled')
        .single();
      
      if (configError) {
        console.error('Error fetching hCaptcha config:', configError);
        // Default to enabled if we can't fetch the config
        return await performVerification(token);
      }

      const isEnabled = configData?.value === 'true';
      
      if (!isEnabled) {
        console.log('hCaptcha verification bypassed - feature disabled');
        return {
          success: true,
          timestamp: new Date().toISOString()
        };
      }

      return await performVerification(token);
    } catch (error) {
      console.error('Error in verifyCaptcha:', error);
      toast({
        title: "Verification Failed",
        description: "An unexpected error occurred during verification. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const performVerification = async (token: string) => {
    const { data, error } = await supabase.functions.invoke('verify-captcha', {
      body: { token }
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

  return { verifyCaptcha };
};
