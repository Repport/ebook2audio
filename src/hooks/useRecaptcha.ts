
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRecaptcha = (isDialogOpen: boolean) => {
  const { toast } = useToast();

  const { data: reCaptchaKey, isError } = useQuery({
    queryKey: ['recaptcha-site-key'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'recaptcha_site_key')
        .maybeSingle();

      if (error) {
        console.error('Error fetching reCAPTCHA site key:', error);
        throw error;
      }

      if (!data) {
        throw new Error('ReCAPTCHA site key not found in configuration');
      }

      return data.value;
    }
  });

  useEffect(() => {
    if (reCaptchaKey && isDialogOpen) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${reCaptchaKey}`;
      script.async = true;
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [reCaptchaKey, isDialogOpen]);

  const executeRecaptcha = async () => {
    if (!window.grecaptcha) {
      console.error('reCAPTCHA not loaded');
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(reCaptchaKey, { action: 'terms_acceptance' });
      console.log('reCAPTCHA token generated');
      return token;
    } catch (error) {
      console.error('Error executing reCAPTCHA:', error);
      return null;
    }
  };

  const verifyRecaptcha = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token, expectedAction: 'terms_acceptance' }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error verifying reCAPTCHA:', error);
      return null;
    }
  };

  return {
    reCaptchaKey,
    isError,
    executeRecaptcha,
    verifyRecaptcha
  };
};
