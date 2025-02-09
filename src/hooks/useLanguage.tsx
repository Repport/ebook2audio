
import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'english' | 'spanish' | 'french' | 'german';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: Record<string, string>;
};

const translations = {
  english: {
    // Authentication
    "signIn": "Sign in",
    "signUp": "Sign up",
    // Main page
    "title": "eBook to MP3 Converter",
    "subtitle": "Convert your EPUB and PDF books to MP3 audio files with advanced chapter detection",
    "featureChapterDetection": "✓ Chapter Detection",
    "featureMultipleVoices": "✓ Multiple Voices",
    "featureSupport": "✓ EPUB & PDF Support",
    // Settings page
    "accountSettings": "Account Settings",
    "backToHome": "Back to Home",
    "changePassword": "Change Password",
    "changeEmail": "Change Email",
    "currentEmail": "Current Email",
    "newEmail": "New Email",
    "newPassword": "New Password",
    "confirmNewPassword": "Confirm New Password",
    "updating": "Updating...",
    "updatePassword": "Update Password",
    "updateEmail": "Update Email",
    "success": "Success",
    "passwordUpdated": "Your password has been updated successfully.",
    "emailVerificationSent": "Verification email sent",
    "checkEmail": "Please check your new email address to confirm the change.",
    "errorUpdatingPassword": "Error updating password",
    "errorUpdatingEmail": "Error updating email",
    "passwordsDontMatch": "Passwords don't match",
    "passwordsMatchError": "Please make sure your passwords match.",
    // Terms dialog
    "termsTitle": "Notice and Terms of Use",
    "termsDescription": "Before proceeding with the conversion of your file to audio, you must accept the following terms",
    "userResponsibility": "1. User Responsibility",
    "userResponsibilityDesc": "You declare and guarantee that you have the legal rights to use, process, and convert the content of the file you are uploading.",
    "copyrightCompliance": "2. Copyright Compliance",
    "copyrightComplianceDesc": "Uploading copyrighted content without explicit authorization from the rights holder is strictly prohibited. The user is solely responsible for any infringement.",
    "liabilityDisclaimer": "3. Liability Disclaimer",
    "liabilityDisclaimerDesc": "Our service does not review or monitor the content of uploaded files. We assume no responsibility for the misuse of the service or any legal claims arising from the processed content.",
    "fileRetention": "4. File Retention Policy",
    "fileRetentionDesc1": "The uploaded files and generated audio will be retained for 30 days for support and claim purposes.",
    "fileRetentionDesc2": "After this period, all files will be automatically deleted and will no longer be accessible.",
    "fileRetentionDesc3": "Users can request early deletion by contacting our support team.",
    "privacySection": "5. Privacy Policy",
    "privacyDesc": "Your files are stored securely and are not shared with third parties. Please refer to our privacy policy for more details.",
    "termsSection": "6. Terms of Use",
    "termsDesc": "We reserve the right to suspend or terminate access to this service in case of misuse or violation of these terms.",
    "acceptTerms": "I accept the terms and conditions and confirm that I have the legal rights to the content of the uploaded file.",
    "cancel": "Cancel",
    "acceptAndContinue": "Accept and Continue",
    // Cookie consent
    "cookieTitle": "We use cookies",
    "cookieAcceptAll": "Accept All Cookies",
    "cookieAcceptNecessary": "Accept Necessary Only",
    "cookieDescription": "We use cookies to enhance your browsing experience and provide personalized services. These include:",
    "cookieNecessary": "Necessary cookies: Essential for website functionality and security.",
    "cookieAnalytics": "Analytics cookies: Help us understand how you use our website",
    "cookieAdvertising": "Advertising cookies: Allow us to show you relevant advertisements",
    "cookieMessage": "By clicking \"Accept All Cookies\", you consent to our use of all cookies. Click \"Accept Necessary Only\" to reject analytics and advertising cookies. Read more in our",
    "cookiePolicy": "Cookie Policy",
    "privacyPolicy": "Privacy Policy",
    "or": "or",
    "backToConverter": "← Back to Converter",
    "cookiesAccepted": "Cookies accepted",
    "cookiesAcceptedDesc": "Thank you for accepting cookies. Your preferences have been saved.",
    "preferencesDesc": "Only necessary cookies will be used. You can change this anytime.",
    "preferencesSaved": "Preferences saved"
  },
  spanish: {
    "signIn": "Iniciar sesión",
    "signUp": "Registrarse",
    "title": "Conversor de eBook a MP3",
    "subtitle": "Convierte tus libros EPUB y PDF a archivos MP3 con detección avanzada de capítulos",
    "featureChapterDetection": "✓ Detección de Capítulos",
    "featureMultipleVoices": "✓ Múltiples Voces",
    "featureSupport": "✓ Soporte EPUB y PDF",
    // Cookie consent translations
    "cookieTitle": "Utilizamos cookies",
    "cookieAcceptAll": "Aceptar todas las cookies",
    "cookieAcceptNecessary": "Aceptar solo las necesarias",
    "cookieDescription": "Utilizamos cookies para mejorar su experiencia de navegación y proporcionar servicios personalizados. Estas incluyen:",
    "cookieNecessary": "Cookies necesarias: Esenciales para la funcionalidad y seguridad del sitio web",
    "cookieAnalytics": "Cookies analíticas: Nos ayudan a entender cómo utiliza nuestro sitio web",
    "cookieAdvertising": "Cookies publicitarias: Nos permiten mostrarle anuncios relevantes",
    "cookieMessage": "Al hacer clic en \"Aceptar todas las cookies\", acepta nuestro uso de todas las cookies. Haga clic en \"Aceptar solo las necesarias\" para rechazar las cookies analíticas y publicitarias. Lea más en nuestra",
    "cookiePolicy": "Política de Cookies",
    "privacyPolicy": "Política de Privacidad",
    "or": "o",
    "backToConverter": "← Volver al Conversor",
    "cookiesAccepted": "Cookies aceptadas",
    "cookiesAcceptedDesc": "Gracias por aceptar las cookies. Sus preferencias han sido guardadas.",
    "preferencesDesc": "Solo se utilizarán las cookies necesarias. Puede cambiar esto en cualquier momento.",
    "preferencesSaved": "Preferencias guardadas"
  },
  french: {
    "signIn": "Se connecter",
    "signUp": "S'inscrire",
    "title": "Convertisseur eBook vers MP3",
    "subtitle": "Convertissez vos livres EPUB et PDF en fichiers audio MP3 avec détection avancée des chapitres",
    "featureChapterDetection": "✓ Détection des Chapitres",
    "featureMultipleVoices": "✓ Voix Multiples",
    "featureSupport": "✓ Support EPUB et PDF",
    // Cookie consent translations
    "cookieTitle": "Nous utilisons des cookies",
    "cookieAcceptAll": "Accepter tous les cookies",
    "cookieAcceptNecessary": "Accepter uniquement les nécessaires",
    "cookieDescription": "Nous utilisons des cookies pour améliorer votre expérience de navigation et fournir des services personnalisés. Ceux-ci incluent :",
    "cookieNecessary": "Cookies nécessaires : Essentiels pour la fonctionnalité et la sécurité du site",
    "cookieAnalytics": "Cookies analytiques : Nous aident à comprendre comment vous utilisez notre site",
    "cookieAdvertising": "Cookies publicitaires : Nous permettent de vous montrer des publicités pertinentes",
    "cookieMessage": "En cliquant sur \"Accepter tous les cookies\", vous consentez à notre utilisation de tous les cookies. Cliquez sur \"Accepter uniquement les nécessaires\" pour rejeter les cookies analytiques et publicitaires. En savoir plus dans notre",
    "cookiePolicy": "Politique de Cookies",
    "privacyPolicy": "Politique de Confidentialité",
    "or": "ou",
    "backToConverter": "← Retour au Convertisseur",
    "cookiesAccepted": "Cookies acceptés",
    "cookiesAcceptedDesc": "Merci d'avoir accepté les cookies. Vos préférences ont été enregistrées.",
    "preferencesDesc": "Seuls les cookies nécessaires seront utilisés. Vous pouvez modifier cela à tout moment.",
    "preferencesSaved": "Préférences enregistrées"
  },
  german: {
    "signIn": "Anmelden",
    "signUp": "Registrieren",
    "title": "eBook zu MP3 Konverter",
    "subtitle": "Konvertieren Sie Ihre EPUB- und PDF-Bücher in MP3-Audiodateien mit erweiterter Kapitelserkennung",
    "featureChapterDetection": "✓ Kapitelerkennung",
    "featureMultipleVoices": "✓ Mehrere Stimmen",
    "featureSupport": "✓ EPUB & PDF Unterstützung",
    // Cookie consent translations
    "cookieTitle": "Wir verwenden Cookies",
    "cookieAcceptAll": "Alle Cookies akzeptieren",
    "cookieAcceptNecessary": "Nur notwendige akzeptieren",
    "cookieDescription": "Wir verwenden Cookies, um Ihr Browsererlebnis zu verbessern und personalisierte Dienste anzubieten. Diese umfassen:",
    "cookieNecessary": "Notwendige Cookies: Essentiell für die Funktionalität und Sicherheit der Website",
    "cookieAnalytics": "Analyse-Cookies: Helfen uns zu verstehen, wie Sie unsere Website nutzen",
    "cookieAdvertising": "Werbe-Cookies: Ermöglichen es uns, relevante Werbung anzuzeigen",
    "cookieMessage": "Durch Klicken auf \"Alle Cookies akzeptieren\" stimmen Sie der Verwendung aller Cookies zu. Klicken Sie auf \"Nur notwendige akzeptieren\", um Analyse- und Werbe-Cookies abzulehnen. Lesen Sie mehr in unserer",
    "cookiePolicy": "Cookie-Richtlinie",
    "privacyPolicy": "Datenschutzerklärung",
    "or": "oder",
    "backToConverter": "← Zurück zum Konverter",
    "cookiesAccepted": "Cookies akzeptiert",
    "cookiesAcceptedDesc": "Vielen Dank für die Annahme der Cookies. Ihre Einstellungen wurden gespeichert.",
    "preferencesDesc": "Es werden nur notwendige Cookies verwendet. Sie können dies jederzeit ändern.",
    "preferencesSaved": "Einstellungen gespeichert"
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
