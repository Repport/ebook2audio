
import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'english' | 'spanish' | 'french' | 'german';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: Record<string, string>;
};

const translations = {
  english: {
    "signIn": "Sign in",
    "signUp": "Sign up",
    "title": "eBook to MP3 Converter",
    "subtitle": "Convert your EPUB and PDF books to MP3 audio files with advanced chapter detection",
    "featureChapterDetection": "✓ Chapter Detection",
    "featureMultipleVoices": "✓ Multiple Voices",
    "featureSupport": "✓ EPUB & PDF Support"
  },
  spanish: {
    "signIn": "Iniciar sesión",
    "signUp": "Registrarse",
    "title": "Conversor de eBook a MP3",
    "subtitle": "Convierte tus libros EPUB y PDF a archivos MP3 con detección avanzada de capítulos",
    "featureChapterDetection": "✓ Detección de Capítulos",
    "featureMultipleVoices": "✓ Múltiples Voces",
    "featureSupport": "✓ Soporte EPUB y PDF"
  },
  french: {
    "signIn": "Se connecter",
    "signUp": "S'inscrire",
    "title": "Convertisseur eBook vers MP3",
    "subtitle": "Convertissez vos livres EPUB et PDF en fichiers audio MP3 avec détection avancée des chapitres",
    "featureChapterDetection": "✓ Détection des Chapitres",
    "featureMultipleVoices": "✓ Voix Multiples",
    "featureSupport": "✓ Support EPUB et PDF"
  },
  german: {
    "signIn": "Anmelden",
    "signUp": "Registrieren",
    "title": "eBook zu MP3 Konverter",
    "subtitle": "Konvertieren Sie Ihre EPUB- und PDF-Bücher in MP3-Audiodateien mit erweiterter Kapitelserkennung",
    "featureChapterDetection": "✓ Kapitelerkennung",
    "featureMultipleVoices": "✓ Mehrere Stimmen",
    "featureSupport": "✓ EPUB & PDF Unterstützung"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('english');

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage,
      translations: translations[language]
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
