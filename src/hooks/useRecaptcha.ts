
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRecaptcha = (isDialogOpen: boolean) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

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
    if (!reCaptchaKey || !isDialogOpen) return;

    // Remove any existing reCAPTCHA scripts and reset state
    const existingScript = document.querySelector('script[src*="recaptcha"]');
    if (existingScript) {
      document.head.removeChild(existingScript);
      setIsScriptLoaded(false);
      delete window.grecaptcha;
    }

    if (!isScriptLoaded) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${reCaptchaKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsScriptLoaded(true);
        // Initialize reCAPTCHA after script loads
        window.grecaptcha?.ready(() => {
          console.log('reCAPTCHA is ready');
        });
      };
      document.head.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
          setIsScriptLoaded(false);
          delete window.grecaptcha;
        }
      };
    }
  }, [reCaptchaKey, isDialogOpen, isScriptLoaded]);

  const executeRecaptcha = async () => {
    if (!window.grecaptcha || !reCaptchaKey) {
      console.error('reCAPTCHA not loaded or site key missing');
      return null;
    }

    try {
      // Wait for reCAPTCHA to be ready
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (window.grecaptcha && window.grecaptcha.execute) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });

      console.log('Executing reCAPTCHA...');
      const token = await window.grecaptcha.execute(reCaptchaKey, { 
        action: 'terms_acceptance' 
      });
      
      console.log('reCAPTCHA token generated:', token ? 'success' : 'failed');
      return token;
    } catch (error) {
      console.error('Error executing reCAPTCHA:', error);
      return null;
    }
  };

  return {
    reCaptchaKey,
    isError,
    isScriptLoaded,
    executeRecaptcha
  };
};
