
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRecaptcha = (isDialogOpen: boolean) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

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
      setInitializationError(null);
      delete window.grecaptcha;
    }

    if (!isScriptLoaded) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${reCaptchaKey}`;
      script.async = true;
      script.defer = true;

      // Add error handling for script loading
      script.onerror = () => {
        console.error('Failed to load reCAPTCHA script');
        setInitializationError('Failed to load reCAPTCHA script');
        setIsScriptLoaded(false);
      };

      script.onload = () => {
        setIsScriptLoaded(true);
        // Initialize reCAPTCHA after script loads
        window.grecaptcha?.ready(() => {
          console.log('reCAPTCHA is ready');
          // Verify initialization
          if (!window.grecaptcha?.execute) {
            console.error('reCAPTCHA not properly initialized');
            setInitializationError('reCAPTCHA initialization failed');
            setIsScriptLoaded(false);
          }
        });
      };

      document.head.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
          setIsScriptLoaded(false);
          setInitializationError(null);
          delete window.grecaptcha;
        }
      };
    }
  }, [reCaptchaKey, isDialogOpen, isScriptLoaded]);

  const executeRecaptcha = async () => {
    if (!window.grecaptcha || !reCaptchaKey) {
      console.error('reCAPTCHA not loaded or site key missing');
      throw new Error('reCAPTCHA not initialized properly');
    }

    try {
      // Wait for reCAPTCHA to be ready with a timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('reCAPTCHA initialization timeout'));
        }, 5000); // 5 second timeout

        const checkReady = () => {
          if (window.grecaptcha && window.grecaptcha.execute) {
            clearTimeout(timeout);
            resolve();
          } else if (!isScriptLoaded || initializationError) {
            clearTimeout(timeout);
            reject(new Error(initializationError || 'reCAPTCHA not initialized'));
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
      
      if (!token) {
        throw new Error('Failed to generate reCAPTCHA token');
      }

      console.log('reCAPTCHA token generated:', token ? 'success' : 'failed');
      return token;
    } catch (error) {
      console.error('Error executing reCAPTCHA:', error);
      throw error; // Re-throw to handle in the component
    }
  };

  return {
    reCaptchaKey,
    isError,
    isScriptLoaded,
    initializationError,
    executeRecaptcha
  };
};
