
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRecaptcha = (isDialogOpen: boolean) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const { data: config } = useQuery({
    queryKey: ['recaptcha-config'],
    queryFn: async () => {
      const { data: enabled, error: enabledError } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'recaptcha_enabled')
        .single();

      if (enabledError) throw enabledError;

      if (enabled.value !== 'true') {
        return { enabled: false, key: null };
      }

      const { data: key, error: keyError } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'recaptcha_site_key')
        .maybeSingle();

      if (keyError) throw keyError;
      if (!key) throw new Error('ReCAPTCHA site key not found');

      return { enabled: true, key: key.value };
    }
  });

  useEffect(() => {
    if (!config?.enabled || !config?.key || !isDialogOpen) return;

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
      script.src = `https://www.google.com/recaptcha/enterprise.js?render=${config.key}`;
      script.async = true;
      script.defer = true;

      script.onerror = () => {
        console.error('Failed to load reCAPTCHA Enterprise script');
        setInitializationError('Failed to load reCAPTCHA Enterprise script');
        setIsScriptLoaded(false);
      };

      script.onload = () => {
        setIsScriptLoaded(true);
        window.grecaptcha.enterprise.ready(() => {
          console.log('reCAPTCHA Enterprise is ready');
          if (!window.grecaptcha?.enterprise?.execute) {
            console.error('reCAPTCHA Enterprise not properly initialized');
            setInitializationError('reCAPTCHA Enterprise initialization failed');
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
  }, [config?.enabled, config?.key, isDialogOpen, isScriptLoaded]);

  const executeRecaptcha = async () => {
    if (!config?.enabled) {
      console.log('reCAPTCHA is disabled, returning mock token');
      return 'mock-token-recaptcha-disabled';
    }

    if (!window.grecaptcha?.enterprise || !config?.key) {
      console.error('reCAPTCHA Enterprise not loaded or site key missing');
      throw new Error('reCAPTCHA Enterprise not initialized properly');
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('reCAPTCHA Enterprise initialization timeout'));
        }, 5000);

        const checkReady = () => {
          if (window.grecaptcha?.enterprise?.execute) {
            clearTimeout(timeout);
            resolve();
          } else if (!isScriptLoaded || initializationError) {
            clearTimeout(timeout);
            reject(new Error(initializationError || 'reCAPTCHA Enterprise not initialized'));
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });

      console.log('Executing reCAPTCHA Enterprise...');
      const token = await window.grecaptcha.enterprise.execute(config.key, { 
        action: 'terms_acceptance' 
      });
      
      if (!token) {
        throw new Error('Failed to generate reCAPTCHA Enterprise token');
      }

      console.log('reCAPTCHA Enterprise token generated:', token ? 'success' : 'failed');
      return token;
    } catch (error) {
      console.error('Error executing reCAPTCHA Enterprise:', error);
      throw error;
    }
  };

  return {
    reCaptchaKey: config?.key,
    isEnabled: config?.enabled,
    isError: !config,
    isScriptLoaded,
    initializationError,
    executeRecaptcha
  };
};
