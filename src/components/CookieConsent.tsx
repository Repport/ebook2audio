import React from 'react';
import CookieConsent from 'react-cookie-consent';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';

const CookieConsentBanner = () => {
  const { toast } = useToast();
  const { translations } = useLanguage();

  const logCookiePreference = async (allAccepted: boolean) => {
    try {
      const { error } = await supabase
        .from('terms_acceptance_logs')
        .insert([
          {
            ip_address: 'anonymous', // We'll get the IP on the server side
            cookies_all_accepted: allAccepted,
            cookies_necessary_only: !allAccepted,
            cookies_acceptance_date: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error logging cookie preference:', error);
        toast({
          title: "Error",
          description: "Failed to save cookie preferences",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error logging cookie preference:', error);
      toast({
        title: "Error",
        description: "Failed to save cookie preferences",
        variant: "destructive",
      });
    }
  };

  return (
    <CookieConsent
      location="bottom"
      buttonText={translations.cookieAcceptAll}
      declineButtonText={translations.cookieAcceptNecessary}
      enableDeclineButton
      cookieName="cookieConsent"
      expires={365}
      style={{
        background: 'rgb(31 41 55)',
        padding: '1rem',
        alignItems: 'center',
        zIndex: 9999
      }}
      buttonStyle={{
        background: '#4F46E5',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        border: 'none'
      }}
      declineButtonStyle={{
        background: 'transparent',
        border: '1px solid #E5E7EB',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        marginRight: '1rem'
      }}
      onAccept={async () => {
        await logCookiePreference(true);
        toast({
          title: translations.cookiesAccepted,
          description: translations.cookiesAcceptedDesc,
        });
      }}
      onDecline={async () => {
        await logCookiePreference(false);
        toast({
          title: translations.preferencesSaved,
          description: translations.preferencesDesc,
        });
      }}
    >
      <p className="text-sm text-white mb-4">
        {translations.cookieDescription}
      </p>
      <ul className="text-sm text-white mb-4 list-disc pl-6 space-y-2">
        <li>{translations.cookieNecessary} Includes caching for improved performance.</li>
        <li>{translations.cookieAnalytics}</li>
        <li>{translations.cookieAdvertising}</li>
      </ul>
      <p className="text-sm text-white">
        {translations.cookieMessage}{" "}
        <a href="/cookie-policy" className="underline hover:text-primary">
          {translations.cookiePolicy}
        </a>
        {" "}{translations.or}{" "}
        <a href="/privacy" className="underline hover:text-primary">
          {translations.privacyPolicy}
        </a>
        .
      </p>
    </CookieConsent>
  );
};

export default CookieConsentBanner;
