
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCaptcha = (isDialogOpen: boolean) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const { data: config } = useQuery({
    queryKey: ['hcaptcha-config'],
    queryFn: async () => {
      const { data: enabled, error: enabledError } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'hcaptcha_enabled')
        .single();

      if (enabledError) throw enabledError;

      if (enabled.value !== 'true') {
        return { enabled: false, key: null };
      }

      return { enabled: true };
    }
  });

  useEffect(() => {
    if (!config?.enabled || !isDialogOpen) return;

    const existingScript = document.querySelector('script[src*="hcaptcha"]');
    if (existingScript) {
      document.head.removeChild(existingScript);
      setIsScriptLoaded(false);
      setInitializationError(null);
      delete window.hcaptcha;
    }

    if (!isScriptLoaded) {
      const script = document.createElement('script');
      script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit';
      script.async = true;
      script.defer = true;

      script.onerror = () => {
        console.error('Failed to load hCaptcha script');
        setInitializationError('Failed to load hCaptcha script');
        setIsScriptLoaded(false);
      };

      script.onload = () => {
        setIsScriptLoaded(true);
        console.log('hCaptcha is ready');
      };

      document.head.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
          setIsScriptLoaded(false);
          setInitializationError(null);
          delete window.hcaptcha;
        }
      };
    }
  }, [config?.enabled, isDialogOpen, isScriptLoaded]);

  const executeCaptcha = async (container: string) => {
    if (!config?.enabled) {
      console.log('hCaptcha is disabled, returning mock token');
      return 'mock-token-hcaptcha-disabled';
    }

    if (!window.hcaptcha) {
      console.error('hCaptcha not loaded');
      throw new Error('hCaptcha not initialized properly');
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('hCaptcha initialization timeout'));
        }, 5000);

        const checkReady = () => {
          if (window.hcaptcha?.render) {
            clearTimeout(timeout);
            resolve();
          } else if (!isScriptLoaded || initializationError) {
            clearTimeout(timeout);
            reject(new Error(initializationError || 'hCaptcha not initialized'));
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });

      console.log('Executing hCaptcha...');
      const widgetId = window.hcaptcha.render(container, {
        sitekey: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
        theme: 'light',
        callback: (token: string) => {
          console.log('hCaptcha callback received');
          return token;
        }
      });

      const token = await new Promise<string>((resolve, reject) => {
        window.hcaptcha.execute(widgetId).then((token: string) => {
          if (!token) {
            reject(new Error('Failed to generate hCaptcha token'));
          }
          resolve(token);
        }).catch(reject);
      });

      console.log('hCaptcha token generated:', token ? 'success' : 'failed');
      return token;
    } catch (error) {
      console.error('Error executing hCaptcha:', error);
      throw error;
    }
  };

  return {
    isEnabled: config?.enabled,
    isError: !config,
    isScriptLoaded,
    initializationError,
    executeCaptcha
  };
};
