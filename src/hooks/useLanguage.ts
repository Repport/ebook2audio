
import { useCallback, useState, useEffect } from 'react';

// Default translations for terms dialog
const defaultTranslations = {
  termsTitle: 'Terms of Service',
  termsDescription: 'Please read and accept our terms before continuing',
  userResponsibility: 'User Responsibility',
  userResponsibilityDesc: 'You are responsible for ensuring that you have the right to convert this content.',
  copyrightCompliance: 'Copyright Compliance',
  copyrightComplianceDesc: 'Uploading content protected by copyright without permission is prohibited.',
  fileRetention: 'File Retention',
  fileRetentionDesc1: 'Uploaded files are temporarily stored for processing.',
  fileRetentionDesc2: 'Files are automatically deleted after the conversion is complete.',
  privacySection: 'Privacy',
  privacyDesc: 'We respect your privacy and only use your data for the requested conversion process.',
  acceptTerms: 'I accept the terms and conditions',
  cancel: 'Cancel',
  acceptAndContinue: 'Accept & Continue'
};

export function useLanguage() {
  const [translations, setTranslations] = useState(defaultTranslations);
  const [language, setLanguage] = useState('en');
  
  // Load translations based on browser language
  useEffect(() => {
    const browserLang = navigator.language.substring(0, 2);
    setLanguage(browserLang);
    
    // In a real app, you would load translations from a server or file
    // For now, we'll just use the default English translations
    setTranslations(defaultTranslations);
  }, []);
  
  const translate = useCallback((key: string): string => {
    return translations[key] || key;
  }, [translations]);
  
  return {
    language,
    setLanguage,
    translations,
    translate
  };
}
