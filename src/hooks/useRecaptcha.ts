
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRecaptcha = (isDialogOpen: boolean) => {
  const { data: reCaptchaKey, isError } = useQuery({
    queryKey: ['recaptcha-site-key'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'recaptcha_site_key')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('ReCAPTCHA site key not found');
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

  return {
    reCaptchaKey,
    isError,
    executeRecaptcha
  };
};
