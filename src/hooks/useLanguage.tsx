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
    "featureSupport": "✓ EPUB & PDF Support",
    // Cookie consent translations
    "cookieTitle": "We use cookies",
    "cookieAcceptAll": "Accept All Cookies",
    "cookieAcceptNecessary": "Accept Necessary Only",
    "cookieDescription": "We use cookies to enhance your browsing experience and provide personalized services. These include:",
    "cookieNecessary": "Necessary cookies: Essential for website functionality and security",
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
    "preferencesSaved": "Preferences saved",
    "liabilityDisclaimer": "While our service retains conversion data and files for 30 days for technical support purposes, we do not actively review or monitor the content of uploaded files. We assume no responsibility for the misuse of the service or any legal claims arising from the processed content.",
    "dataRetentionTitle": "Data Retention",
    "dataRetentionDesc": "Your files and conversion data are retained for 30 days for technical support and claim resolution purposes. This retention period allows us to:",
    "supportAssistance": "Provide technical support and troubleshooting assistance",
    "qualityIssues": "Address any conversion quality issues",
    "copyrightClaims": "Handle potential copyright or content-related claims",
    "serviceQuality": "Ensure service quality and maintain conversion history",
    "retentionNotice": "After the 30-day retention period, both the original and converted files are permanently deleted from our servers through an automated process."
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
    "preferencesSaved": "Preferencias guardadas",
    "liabilityDisclaimer": "Si bien nuestro servicio conserva los datos de conversión y archivos durante 30 días para fines de soporte técnico, no revisamos ni monitoreamos activamente el contenido de los archivos cargados. No asumimos ninguna responsabilidad por el mal uso del servicio o cualquier reclamo legal que surja del contenido procesado.",
    "dataRetentionTitle": "Retención de Datos",
    "dataRetentionDesc": "Sus archivos y datos de conversión se conservan durante 30 días para fines de soporte técnico y resolución de reclamos. Este período de retención nos permite:",
    "supportAssistance": "Proporcionar asistencia técnica y solución de problemas",
    "qualityIssues": "Abordar cualquier problema de calidad de conversión",
    "copyrightClaims": "Manejar posibles reclamos relacionados con derechos de autor o contenido",
    "serviceQuality": "Asegurar la calidad del servicio y mantener el historial de conversiones",
    "retentionNotice": "Después del período de retención de 30 días, tanto los archivos originales como los convertidos se eliminan permanentemente de nuestros servidores mediante un proceso automatizado."
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
    "preferencesSaved": "Préférences enregistrées",
    "liabilityDisclaimer": "Bien que notre service conserve les données de conversion et les fichiers pendant 30 jours à des fins de support technique, nous ne révisons ni ne surveillons activement le contenu des fichiers téléchargés. Nous n'assumons aucune responsabilité pour l'utilisation abusive du service ou toute réclamation légale découlant du contenu traité.",
    "dataRetentionTitle": "Conservation des Données",
    "dataRetentionDesc": "Vos fichiers et données de conversion sont conservés pendant 30 jours à des fins de support technique et de résolution des réclamations. Cette période de conservation nous permet de :",
    "supportAssistance": "Fournir une assistance technique et un dépannage",
    "qualityIssues": "Traiter les problèmes de qualité de conversion",
    "copyrightClaims": "Gérer les réclamations potentielles liées aux droits d'auteur ou au contenu",
    "serviceQuality": "Assurer la qualité du service et maintenir l'historique des conversions",
    "retentionNotice": "Après la période de conservation de 30 jours, les fichiers originaux et convertis sont définitivement supprimés de nos serveurs par un processus automatisé."
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
    "preferencesSaved": "Einstellungen gespeichert",
    "liabilityDisclaimer": "Während unser Service Konvertierungsdaten und Dateien für 30 Tage zu technischen Supportzwecken speichert, überprüfen oder überwachen wir den Inhalt der hochgeladenen Dateien nicht aktiv. Wir übernehmen keine Verantwortung für den Missbrauch des Dienstes oder rechtliche Ansprüche, die sich aus dem verarbeiteten Inhalt ergeben.",
    "dataRetentionTitle": "Datenspeicherung",
    "dataRetentionDesc": "Ihre Dateien und Konvertierungsdaten werden 30 Tage lang für technischen Support und Reklamationsbearbeitung aufbewahrt. Diese Aufbewahrungsfrist ermöglicht uns:",
    "supportAssistance": "Technischen Support und Fehlerbehebung anzubieten",
    "qualityIssues": "Probleme mit der Konvertierungsqualität zu beheben",
    "copyrightClaims": "Potenzielle Urheberrechts- oder inhaltsbezogene Ansprüche zu bearbeiten",
    "serviceQuality": "Die Servicequalität sicherzustellen und den Konvertierungsverlauf zu verwalten",
    "retentionNotice": "Nach der 30-tägigen Aufbewahrungsfrist werden sowohl die Original- als auch die konvertierten Dateien durch einen automatisierten Prozess permanent von unseren Servern gelöscht."
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
