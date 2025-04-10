
import { useCallback, useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Default translations for terms dialog
const defaultTranslations = {
  // Terms dialog
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
  acceptAndContinue: 'Accept & Continue',
  
  // Account settings
  accountSettings: 'Account Settings',
  backToHome: 'Back to Home',
  changePassword: 'Change Password',
  changeEmail: 'Change Email',
  currentEmail: 'Current Email',
  newEmail: 'New Email',
  newPassword: 'New Password',
  confirmNewPassword: 'Confirm New Password',
  updating: 'Updating...',
  updatePassword: 'Update Password',
  updateEmail: 'Update Email',
  success: 'Success',
  passwordUpdated: 'Your password has been updated successfully.',
  emailVerificationSent: 'Verification email sent',
  checkEmail: 'Please check your new email address to confirm the change.',
  errorUpdatingPassword: 'Error updating password',
  errorUpdatingEmail: 'Error updating email',
  passwordsDontMatch: 'Passwords don\'t match',
  passwordsMatchError: 'Please make sure your passwords match.',
  
  // File processing
  fileInformation: 'File Information',
  fileInformationDesc: 'Details about your selected file',
  fileName: 'File name',
  fileType: 'File type',
  fileSize: 'File size',
  totalCharacters: 'Total characters',
  pages: 'Pages',
  removeFile: 'Remove file',
  continue: 'Continue',
  back: 'Back',
  
  // Conversion status
  readyToConvert: 'Ready to convert',
  converting: 'Converting {fileType} to MP3...',
  conversionCompleted: 'Conversion completed!',
  conversionError: 'Conversion error',
  processingChunk: 'Processing chunk {current} of {total}',
  timeElapsed: '{time} elapsed',
  timeRemaining: '{time} remaining',
  
  // Voice settings
  voiceSettings: 'Voice Settings',
  voiceSettingsDesc: 'Customize the voice for your audio file',
  
  // File processor tabs
  fileInfo: 'File Information',
  // We removed the duplicate voiceSettings here
  conversionAndDownload: 'Conversion & Download',
  
  // Conversion step
  convertToAudio: 'Convert to Audio',
  convertDesc: 'Convert your text to high-quality MP3 audio',
  starting: 'Starting...',
  startConversion: 'Start Conversion',
  downloadAudio: 'Download Audio',
  viewConversions: 'View Conversions',
  
  // Cookie consent
  cookieTitle: 'We use cookies',
  cookieAcceptAll: 'Accept All Cookies',
  cookieAcceptNecessary: 'Accept Necessary Only',
  cookieDescription: 'We use cookies to enhance your browsing experience and provide personalized services.',
  cookieNecessary: 'Necessary cookies: Essential for website functionality and security.',
  cookieAnalytics: 'Analytics cookies: Help us understand how you use our website',
  cookieAdvertising: 'Advertising cookies: Allow us to show you relevant advertisements',
  cookieMessage: 'By clicking "Accept All Cookies", you consent to our use of all cookies.',
  cookiePolicy: 'Cookie Policy',
  privacyPolicy: 'Privacy Policy',
  or: 'or',
  cookiesAccepted: 'Cookies accepted',
  cookiesAcceptedDesc: 'Thank you for accepting cookies. Your preferences have been saved.',
  preferencesDesc: 'Only necessary cookies will be used. You can change this anytime.',
  preferencesSaved: 'Preferences saved',
  moreInformation: 'More Information',
  cookieTypes: 'Cookie Types',
  
  // Navigation
  backToConverter: '← Back to Converter',
  
  // Authentication
  signIn: 'Sign In',
  signUp: 'Sign Up'
};

type TranslationsContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  translations: typeof defaultTranslations;
  translate: (key: string) => string;
};

const TranslationsContext = createContext<TranslationsContextType | undefined>(undefined);

// Create a provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
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
    return translations[key as keyof typeof translations] || key;
  }, [translations]);
  
  return (
    <TranslationsContext.Provider value={{
      language,
      setLanguage,
      translations,
      translate
    }}>
      {children}
    </TranslationsContext.Provider>
  );
}

// Hook to use the translations
export function useLanguage() {
  const context = useContext(TranslationsContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
