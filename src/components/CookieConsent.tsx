import React, { useState } from 'react';
import CookieConsent from 'react-cookie-consent';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { Settings2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

const CookieConsentBanner = () => {
  const { translations } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);

  // Check if cookies were already accepted
  if (document.cookie.includes('cookieConsent=true')) {
    return null;
  }

  const logCookiePreference = async (allAccepted: boolean) => {
    try {
      await supabase
        .from('user_consents')
        .insert([
          {
            ip_address: 'anonymous',
            privacy_accepted: true,
            terms_accepted: true,
            marketing_accepted: allAccepted,
            user_agent: navigator.userAgent,
            accepted_at: new Date().toISOString()
          }
        ]);
    } catch (error) {
      console.error('Error logging cookie preference:', error);
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
        padding: '0.75rem',
        alignItems: 'center',
        zIndex: 9999,
        gap: '0.5rem',
        display: 'flex',
        flexWrap: 'wrap'
      }}
      buttonStyle={{
        background: '#4F46E5',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        border: 'none',
        minWidth: 'auto',
        margin: '0'
      }}
      declineButtonStyle={{
        background: 'transparent',
        border: '1px solid #E5E7EB',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        marginRight: '0.5rem',
        minWidth: 'auto',
        margin: '0'
      }}
      onAccept={async () => {
        await logCookiePreference(true);
      }}
      onDecline={async () => {
        await logCookiePreference(false);
      }}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <p className="text-sm text-white m-0">
          {translations.cookieDescription}
        </p>
        
        <Sheet>
          <SheetTrigger asChild>
            <button 
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Settings2 className="h-5 w-5 text-white" />
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{translations.cookiePolicy}</SheetTitle>
              <SheetDescription>
                {translations.cookieDescription}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <h4 className="font-medium">{translations.cookieTypes}</h4>
                <ul className="text-sm space-y-2 list-disc pl-6">
                  <li>{translations.cookieNecessary}</li>
                  <li>{translations.cookieAnalytics}</li>
                  <li>{translations.cookieAdvertising}</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">{translations.moreInformation}</h4>
                <p className="text-sm text-muted-foreground">
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
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </CookieConsent>
  );
};

export default CookieConsentBanner;
