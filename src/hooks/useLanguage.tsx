
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define our translation types
type SupportedLanguage = 'en' | 'es' | 'fr' | 'de';

// Define translations for all supported elements
type TranslationKeys = {
  signIn: string;
  signUp: string;
  submit: string;
  cancel: string;
  selectVoice: string;
  continueButton: string;
  notifyMe: string;
  loading: string;
  error: string;
  success: string;
};

// Define all our translations
const translations: Record<SupportedLanguage, TranslationKeys> = {
  en: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    submit: 'Submit',
    cancel: 'Cancel',
    selectVoice: 'Select a voice...',
    continueButton: 'Continue',
    notifyMe: 'Notify me when conversion is complete',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  es: {
    signIn: 'Iniciar Sesión',
    signUp: 'Registrarse',
    submit: 'Enviar',
    cancel: 'Cancelar',
    selectVoice: 'Seleccionar una voz...',
    continueButton: 'Continuar',
    notifyMe: 'Notificarme cuando la conversión esté completa',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
  },
  fr: {
    signIn: 'Connexion',
    signUp: 'S\'inscrire',
    submit: 'Soumettre',
    cancel: 'Annuler',
    selectVoice: 'Sélectionner une voix...',
    continueButton: 'Continuer',
    notifyMe: 'Me notifier lorsque la conversion est terminée',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
  },
  de: {
    signIn: 'Anmelden',
    signUp: 'Registrieren',
    submit: 'Absenden',
    cancel: 'Abbrechen',
    selectVoice: 'Stimme auswählen...',
    continueButton: 'Weiter',
    notifyMe: 'Benachrichtigen, wenn die Konvertierung abgeschlossen ist',
    loading: 'Wird geladen...',
    error: 'Fehler',
    success: 'Erfolg',
  },
};

// Create the context with default values
type LanguageContextType = {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  translations: TranslationKeys;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Create the provider component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  // Load language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && ['en', 'es', 'fr', 'de'].includes(savedLanguage)) {
      setLanguage(savedLanguage as SupportedLanguage);
    }
  }, []);

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', language);
  }, [language]);

  const value = {
    language,
    setLanguage,
    translations: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Create and export the hook
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
