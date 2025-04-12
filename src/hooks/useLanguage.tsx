
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define our translation types
type SupportedLanguage = 'en' | 'es' | 'fr' | 'de';

// Define translations for all supported elements
type TranslationKeys = {
  // Auth related
  signIn: string;
  signUp: string;
  submit: string;
  cancel: string;
  
  // General UI
  selectVoice: string;
  continueButton: string;
  notifyMe: string;
  loading: string;
  error: string;
  success: string;
  starting: string;
  continue: string;
  back: string;
  or: string;
  
  // Account settings
  passwordsDontMatch: string;
  passwordsMatchError: string;
  passwordUpdated: string;
  errorUpdatingPassword: string;
  emailVerificationSent: string;
  checkEmail: string;
  errorUpdatingEmail: string;
  changePassword: string;
  newPassword: string;
  confirmNewPassword: string;
  updating: string;
  updatePassword: string;
  changeEmail: string;
  currentEmail: string;
  newEmail: string;
  updateEmail: string;
  accountSettings: string;
  backToHome: string;
  
  // Conversion related
  readyToConvert: string;
  converting: string;
  conversionCompleted: string;
  conversionError: string;
  startConversion: string;
  downloadAudio: string;
  viewConversions: string;
  convertToAudio: string;
  convertDesc: string;
  backToConverter: string;
  
  // Files
  fileInformation: string;
  fileInformationDesc: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  totalCharacters: string;
  pages: string;
  removeFile: string;
  
  // Voice settings
  voiceSettings: string;
  voiceSettingsDesc: string;
  
  // Tabs
  fileInfo: string;
  conversionAndDownload: string;
  
  // Terms and Cookies
  termsTitle: string;
  termsDescription: string;
  userResponsibility: string;
  userResponsibilityDesc: string;
  copyrightCompliance: string;
  copyrightComplianceDesc: string;
  fileRetention: string;
  fileRetentionDesc1: string;
  fileRetentionDesc2: string;
  privacySection: string;
  privacyDesc: string;
  acceptTerms: string;
  acceptAndContinue: string;
  cookieAcceptAll: string;
  cookieAcceptNecessary: string;
  cookieDescription: string;
  cookiePolicy: string;
  cookieTypes: string;
  cookieNecessary: string;
  cookieAnalytics: string;
  cookieAdvertising: string;
  moreInformation: string;
  cookieMessage: string;
  privacyPolicy: string;
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
    starting: 'Starting...',
    continue: 'Continue',
    back: 'Back',
    or: 'or',
    
    // Account settings
    passwordsDontMatch: 'Passwords don\'t match',
    passwordsMatchError: 'The new passwords you entered do not match',
    passwordUpdated: 'Password has been updated successfully',
    errorUpdatingPassword: 'Error updating password',
    emailVerificationSent: 'Email verification sent',
    checkEmail: 'Please check your email for verification',
    errorUpdatingEmail: 'Error updating email',
    changePassword: 'Change Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    updating: 'Updating...',
    updatePassword: 'Update Password',
    changeEmail: 'Change Email',
    currentEmail: 'Current Email',
    newEmail: 'New Email',
    updateEmail: 'Update Email',
    accountSettings: 'Account Settings',
    backToHome: 'Back to Home',
    
    // Conversion related
    readyToConvert: 'Ready to convert',
    converting: 'Converting...',
    conversionCompleted: 'Conversion completed',
    conversionError: 'Conversion error',
    startConversion: 'Start Conversion',
    downloadAudio: 'Download Audio',
    viewConversions: 'View Conversions',
    convertToAudio: 'Convert to Audio',
    convertDesc: 'Start the conversion process and download your audio',
    backToConverter: 'Back to Converter',
    
    // Files
    fileInformation: 'File Information',
    fileInformationDesc: 'Details about your selected file',
    fileName: 'File name',
    fileType: 'File type',
    fileSize: 'File size',
    totalCharacters: 'Total characters',
    pages: 'Pages',
    removeFile: 'Remove file',
    
    // Voice settings
    voiceSettings: 'Voice Settings',
    voiceSettingsDesc: 'Choose a voice and other conversion settings',
    
    // Tabs
    fileInfo: 'File Information',
    conversionAndDownload: 'Conversion & Download',
    
    // Terms and Cookies
    termsTitle: 'Terms of Service',
    termsDescription: 'Please read and accept our terms before continuing',
    userResponsibility: 'User Responsibility',
    userResponsibilityDesc: 'You are responsible for ensuring that you have the right to convert this content',
    copyrightCompliance: 'Copyright Compliance',
    copyrightComplianceDesc: 'Uploading content protected by copyright without permission is prohibited',
    fileRetention: 'File Retention',
    fileRetentionDesc1: 'Uploaded files are temporarily stored for processing',
    fileRetentionDesc2: 'Files are automatically deleted after the conversion is complete',
    privacySection: 'Privacy',
    privacyDesc: 'We respect your privacy and only use your data for the requested conversion process',
    acceptTerms: 'I accept the terms and conditions',
    acceptAndContinue: 'Accept & Continue',
    cookieAcceptAll: 'Accept All',
    cookieAcceptNecessary: 'Accept Necessary Only',
    cookieDescription: 'We use cookies to improve your experience on our site',
    cookiePolicy: 'Cookie Policy',
    cookieTypes: 'Types of Cookies',
    cookieNecessary: 'Necessary: Essential for the website to function properly',
    cookieAnalytics: 'Analytics: Help us understand how visitors interact with the website',
    cookieAdvertising: 'Advertising: Used to provide you with relevant ads and marketing campaigns',
    moreInformation: 'More Information',
    cookieMessage: 'For more details, please see our',
    privacyPolicy: 'Privacy Policy',
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
    starting: 'Iniciando...',
    continue: 'Continuar',
    back: 'Atrás',
    or: 'o',
    
    // Account settings
    passwordsDontMatch: 'Las contraseñas no coinciden',
    passwordsMatchError: 'Las nuevas contraseñas que ingresaste no coinciden',
    passwordUpdated: 'La contraseña se ha actualizado correctamente',
    errorUpdatingPassword: 'Error al actualizar la contraseña',
    emailVerificationSent: 'Verificación de correo electrónico enviada',
    checkEmail: 'Por favor, revisa tu correo electrónico para verificar',
    errorUpdatingEmail: 'Error al actualizar el correo electrónico',
    changePassword: 'Cambiar Contraseña',
    newPassword: 'Nueva Contraseña',
    confirmNewPassword: 'Confirmar Nueva Contraseña',
    updating: 'Actualizando...',
    updatePassword: 'Actualizar Contraseña',
    changeEmail: 'Cambiar Correo Electrónico',
    currentEmail: 'Correo Electrónico Actual',
    newEmail: 'Nuevo Correo Electrónico',
    updateEmail: 'Actualizar Correo Electrónico',
    accountSettings: 'Configuración de la cuenta',
    backToHome: 'Volver al inicio',
    
    // Conversion related
    readyToConvert: 'Listo para convertir',
    converting: 'Convirtiendo...',
    conversionCompleted: 'Conversión completada',
    conversionError: 'Error de conversión',
    startConversion: 'Iniciar Conversión',
    downloadAudio: 'Descargar Audio',
    viewConversions: 'Ver Conversiones',
    convertToAudio: 'Convertir a Audio',
    convertDesc: 'Inicia el proceso de conversión y descarga tu audio',
    backToConverter: 'Volver al Convertidor',
    
    // Files
    fileInformation: 'Información del Archivo',
    fileInformationDesc: 'Detalles sobre el archivo seleccionado',
    fileName: 'Nombre del archivo',
    fileType: 'Tipo de archivo',
    fileSize: 'Tamaño del archivo',
    totalCharacters: 'Total de caracteres',
    pages: 'Páginas',
    removeFile: 'Eliminar archivo',
    
    // Voice settings
    voiceSettings: 'Configuración de Voz',
    voiceSettingsDesc: 'Elige una voz y otros ajustes de conversión',
    
    // Tabs
    fileInfo: 'Información del Archivo',
    conversionAndDownload: 'Conversión y Descarga',
    
    // Terms and Cookies
    termsTitle: 'Términos de Servicio',
    termsDescription: 'Por favor lee y acepta nuestros términos antes de continuar',
    userResponsibility: 'Responsabilidad del Usuario',
    userResponsibilityDesc: 'Eres responsable de asegurarte de que tienes derecho a convertir este contenido',
    copyrightCompliance: 'Cumplimiento de Derechos de Autor',
    copyrightComplianceDesc: 'Está prohibido subir contenido protegido por derechos de autor sin permiso',
    fileRetention: 'Retención de Archivos',
    fileRetentionDesc1: 'Los archivos subidos se almacenan temporalmente para su procesamiento',
    fileRetentionDesc2: 'Los archivos se eliminan automáticamente después de completar la conversión',
    privacySection: 'Privacidad',
    privacyDesc: 'Respetamos tu privacidad y solo usamos tus datos para el proceso de conversión solicitado',
    acceptTerms: 'Acepto los términos y condiciones',
    acceptAndContinue: 'Aceptar y Continuar',
    cookieAcceptAll: 'Aceptar Todo',
    cookieAcceptNecessary: 'Aceptar Solo lo Necesario',
    cookieDescription: 'Utilizamos cookies para mejorar tu experiencia en nuestro sitio',
    cookiePolicy: 'Política de Cookies',
    cookieTypes: 'Tipos de Cookies',
    cookieNecessary: 'Necesarias: Esenciales para que el sitio web funcione correctamente',
    cookieAnalytics: 'Analíticas: Nos ayudan a entender cómo los visitantes interactúan con el sitio web',
    cookieAdvertising: 'Publicidad: Utilizadas para proporcionarte anuncios relevantes y campañas de marketing',
    moreInformation: 'Más Información',
    cookieMessage: 'Para más detalles, por favor consulta nuestra',
    privacyPolicy: 'Política de Privacidad',
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
    starting: 'Démarrage...',
    continue: 'Continuer',
    back: 'Retour',
    or: 'ou',
    
    // Account settings
    passwordsDontMatch: 'Les mots de passe ne correspondent pas',
    passwordsMatchError: 'Les nouveaux mots de passe que vous avez saisis ne correspondent pas',
    passwordUpdated: 'Le mot de passe a été mis à jour avec succès',
    errorUpdatingPassword: 'Erreur lors de la mise à jour du mot de passe',
    emailVerificationSent: 'Vérification d\'email envoyée',
    checkEmail: 'Veuillez vérifier votre email pour la vérification',
    errorUpdatingEmail: 'Erreur lors de la mise à jour de l\'email',
    changePassword: 'Changer le Mot de Passe',
    newPassword: 'Nouveau Mot de Passe',
    confirmNewPassword: 'Confirmer le Nouveau Mot de Passe',
    updating: 'Mise à jour...',
    updatePassword: 'Mettre à Jour le Mot de Passe',
    changeEmail: 'Changer l\'Email',
    currentEmail: 'Email Actuel',
    newEmail: 'Nouvel Email',
    updateEmail: 'Mettre à Jour l\'Email',
    accountSettings: 'Paramètres du compte',
    backToHome: 'Retour à l\'accueil',
    
    // Conversion related
    readyToConvert: 'Prêt à convertir',
    converting: 'Conversion en cours...',
    conversionCompleted: 'Conversion terminée',
    conversionError: 'Erreur de conversion',
    startConversion: 'Démarrer la Conversion',
    downloadAudio: 'Télécharger l\'Audio',
    viewConversions: 'Voir les Conversions',
    convertToAudio: 'Convertir en Audio',
    convertDesc: 'Démarrez le processus de conversion et téléchargez votre audio',
    backToConverter: 'Retour au Convertisseur',
    
    // Files
    fileInformation: 'Informations sur le Fichier',
    fileInformationDesc: 'Détails sur le fichier sélectionné',
    fileName: 'Nom du fichier',
    fileType: 'Type de fichier',
    fileSize: 'Taille du fichier',
    totalCharacters: 'Total des caractères',
    pages: 'Pages',
    removeFile: 'Supprimer le fichier',
    
    // Voice settings
    voiceSettings: 'Paramètres de Voix',
    voiceSettingsDesc: 'Choisissez une voix et d\'autres paramètres de conversion',
    
    // Tabs
    fileInfo: 'Informations sur le Fichier',
    conversionAndDownload: 'Conversion et Téléchargement',
    
    // Terms and Cookies
    termsTitle: 'Conditions d\'Utilisation',
    termsDescription: 'Veuillez lire et accepter nos conditions avant de continuer',
    userResponsibility: 'Responsabilité de l\'Utilisateur',
    userResponsibilityDesc: 'Vous êtes responsable de vous assurer que vous avez le droit de convertir ce contenu',
    copyrightCompliance: 'Respect des Droits d\'Auteur',
    copyrightComplianceDesc: 'Il est interdit de télécharger du contenu protégé par des droits d\'auteur sans autorisation',
    fileRetention: 'Conservation des Fichiers',
    fileRetentionDesc1: 'Les fichiers téléchargés sont temporairement stockés pour traitement',
    fileRetentionDesc2: 'Les fichiers sont automatiquement supprimés une fois la conversion terminée',
    privacySection: 'Confidentialité',
    privacyDesc: 'Nous respectons votre vie privée et utilisons vos données uniquement pour le processus de conversion demandé',
    acceptTerms: 'J\'accepte les conditions d\'utilisation',
    acceptAndContinue: 'Accepter et Continuer',
    cookieAcceptAll: 'Tout Accepter',
    cookieAcceptNecessary: 'Accepter Uniquement les Nécessaires',
    cookieDescription: 'Nous utilisons des cookies pour améliorer votre expérience sur notre site',
    cookiePolicy: 'Politique de Cookies',
    cookieTypes: 'Types de Cookies',
    cookieNecessary: 'Nécessaires: Essentiels au bon fonctionnement du site web',
    cookieAnalytics: 'Analytiques: Nous aident à comprendre comment les visiteurs interagissent avec le site web',
    cookieAdvertising: 'Publicitaires: Utilisés pour vous proposer des publicités pertinentes et des campagnes marketing',
    moreInformation: 'Plus d\'Informations',
    cookieMessage: 'Pour plus de détails, veuillez consulter notre',
    privacyPolicy: 'Politique de Confidentialité',
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
    starting: 'Startet...',
    continue: 'Fortfahren',
    back: 'Zurück',
    or: 'oder',
    
    // Account settings
    passwordsDontMatch: 'Passwörter stimmen nicht überein',
    passwordsMatchError: 'Die neuen Passwörter, die Sie eingegeben haben, stimmen nicht überein',
    passwordUpdated: 'Passwort wurde erfolgreich aktualisiert',
    errorUpdatingPassword: 'Fehler beim Aktualisieren des Passworts',
    emailVerificationSent: 'E-Mail-Überprüfung gesendet',
    checkEmail: 'Bitte überprüfen Sie Ihre E-Mail zur Verifizierung',
    errorUpdatingEmail: 'Fehler beim Aktualisieren der E-Mail',
    changePassword: 'Passwort ändern',
    newPassword: 'Neues Passwort',
    confirmNewPassword: 'Neues Passwort bestätigen',
    updating: 'Aktualisierung...',
    updatePassword: 'Passwort aktualisieren',
    changeEmail: 'E-Mail ändern',
    currentEmail: 'Aktuelle E-Mail',
    newEmail: 'Neue E-Mail',
    updateEmail: 'E-Mail aktualisieren',
    accountSettings: 'Kontoeinstellungen',
    backToHome: 'Zurück zur Startseite',
    
    // Conversion related
    readyToConvert: 'Bereit zur Konvertierung',
    converting: 'Konvertierung läuft...',
    conversionCompleted: 'Konvertierung abgeschlossen',
    conversionError: 'Konvertierungsfehler',
    startConversion: 'Konvertierung starten',
    downloadAudio: 'Audio herunterladen',
    viewConversions: 'Konvertierungen anzeigen',
    convertToAudio: 'In Audio konvertieren',
    convertDesc: 'Starten Sie den Konvertierungsprozess und laden Sie Ihr Audio herunter',
    backToConverter: 'Zurück zum Konverter',
    
    // Files
    fileInformation: 'Dateiinformationen',
    fileInformationDesc: 'Details über Ihre ausgewählte Datei',
    fileName: 'Dateiname',
    fileType: 'Dateityp',
    fileSize: 'Dateigröße',
    totalCharacters: 'Gesamtzeichenanzahl',
    pages: 'Seiten',
    removeFile: 'Datei entfernen',
    
    // Voice settings
    voiceSettings: 'Spracheinstellungen',
    voiceSettingsDesc: 'Wählen Sie eine Stimme und andere Konvertierungseinstellungen',
    
    // Tabs
    fileInfo: 'Dateiinformationen',
    conversionAndDownload: 'Konvertierung & Download',
    
    // Terms and Cookies
    termsTitle: 'Nutzungsbedingungen',
    termsDescription: 'Bitte lesen und akzeptieren Sie unsere Bedingungen, bevor Sie fortfahren',
    userResponsibility: 'Benutzerverantwortung',
    userResponsibilityDesc: 'Sie sind dafür verantwortlich, sicherzustellen, dass Sie das Recht haben, diesen Inhalt zu konvertieren',
    copyrightCompliance: 'Einhaltung des Urheberrechts',
    copyrightComplianceDesc: 'Das Hochladen von urheberrechtlich geschütztem Inhalt ohne Genehmigung ist verboten',
    fileRetention: 'Dateispeicherung',
    fileRetentionDesc1: 'Hochgeladene Dateien werden vorübergehend zur Verarbeitung gespeichert',
    fileRetentionDesc2: 'Dateien werden nach Abschluss der Konvertierung automatisch gelöscht',
    privacySection: 'Datenschutz',
    privacyDesc: 'Wir respektieren Ihre Privatsphäre und verwenden Ihre Daten nur für den angeforderten Konvertierungsprozess',
    acceptTerms: 'Ich akzeptiere die Nutzungsbedingungen',
    acceptAndContinue: 'Akzeptieren & Fortfahren',
    cookieAcceptAll: 'Alle akzeptieren',
    cookieAcceptNecessary: 'Nur notwendige akzeptieren',
    cookieDescription: 'Wir verwenden Cookies, um Ihr Erlebnis auf unserer Website zu verbessern',
    cookiePolicy: 'Cookie-Richtlinie',
    cookieTypes: 'Cookie-Typen',
    cookieNecessary: 'Notwendig: Unerlässlich für das ordnungsgemäße Funktionieren der Website',
    cookieAnalytics: 'Analytisch: Hilft uns zu verstehen, wie Besucher mit der Website interagieren',
    cookieAdvertising: 'Werbung: Verwendet, um Ihnen relevante Anzeigen und Marketingkampagnen anzubieten',
    moreInformation: 'Weitere Informationen',
    cookieMessage: 'Für weitere Details sehen Sie bitte unsere',
    privacyPolicy: 'Datenschutzrichtlinie',
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
