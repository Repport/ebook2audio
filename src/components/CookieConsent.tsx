
import React from 'react';
import CookieConsent from 'react-cookie-consent';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CookieConsentBanner = () => {
  const { toast } = useToast();

  const logCookiePreference = async (allAccepted: boolean) => {
    try {
      const { error } = await supabase
        .from('terms_acceptance_logs')
        .insert([
          {
            ip_address: 'anonymous', // We'll get the IP on the server side
            cookies_all_accepted: allAccepted,
            cookies_necessary_only: !allAccepted,
          }
        ]);

      if (error) {
        console.error('Error logging cookie preference:', error);
      }
    } catch (error) {
      console.error('Error logging cookie preference:', error);
    }
  };

  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept All Cookies"
      declineButtonText="Accept Necessary Only"
      enableDeclineButton
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
          title: "Cookies accepted",
          description: "Thank you for accepting cookies. Your preferences have been saved.",
        });
      }}
      onDecline={async () => {
        await logCookiePreference(false);
        toast({
          title: "Preferences saved",
          description: "Only necessary cookies will be used. You can change this anytime.",
        });
      }}
    >
      <p className="text-sm text-white mb-4">
        We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
        By clicking "Accept All Cookies", you consent to our use of cookies. Read more about our cookie policy in our{" "}
        <a href="/privacy" className="underline hover:text-primary">
          Privacy Policy
        </a>
        .
      </p>
    </CookieConsent>
  );
};

export default CookieConsentBanner;
