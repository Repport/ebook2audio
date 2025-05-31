import { useCallback, useEffect, useState as ReactUseState, useRef } from 'react';
import { useSessionState } from './session-storage/useSessionState';
import { useSessionLoad } from './session-storage/useSessionLoad';
import { saveToSessionStorage, clearSessionStorageData as clearStorageDataUtils } from './session-storage/useSessionSave';
import { createStateSnapshot } from './session-storage/sessionStorageUtils';
import { useToast } from './use-toast';
import {
  SessionState,
  UseSessionStorageReturn,
  // LoadedSessionState, // Not directly used for SessionState object, but its fields are applied
} from '../types/hooks/session';
import { Chapter } from '../types/hooks/conversion';

export const useSessionStorage = (): UseSessionStorageReturn => {
  // State for UseSessionStorageReturn (manages explicit session objects)
  const [currentSessionObject, setCurrentSessionObject] = ReactUseState<SessionState | null>(null);
  const [isSessionObjectReady, setIsSessionObjectReady] = ReactUseState<boolean>(false);
  const [sessionObjectError, setSessionObjectError] = ReactUseState<string | null>(null);

  // Internal state management for general app state persistence (from useSessionState)
  const {
    selectedFile, setSelectedFile,
    extractedText, setExtractedText,
    chapters, setChapters, // These are the app's main chapters, e.g., from file processing
    currentStep, setCurrentStep,
    detectedLanguage, setDetectedLanguage,
    conversionInProgress, setConversionInProgress,
    isInitialized, setIsInitialized // This flag indicates if app state has been initialized from session storage
  } = useSessionState();

  // Auto-loading logic from useSessionLoad (for general app state)
  const { loadedSession, isSessionLoading, sessionLoadError: sessionLoadHookError } = useSessionLoad();

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const hasAppliedInitialLoadRef = useRef(false); // Tracks if loadedSession has been applied
  const pendingSaveRef = useRef(false);
  const lastSavedSnapshotRef = useRef<string>(''); // For the general app state snapshot
  const { toast } = useToast();

  // Effect to apply loaded general app state from useSessionLoad
  useEffect(() => {
    if (!isSessionLoading && loadedSession && !hasAppliedInitialLoadRef.current) {
      console.log('useSessionStorage: Applying loaded session data to app state', loadedSession);
      setCurrentStep(loadedSession.currentStep || 1);
      setExtractedText(loadedSession.extractedText || '');

      // Map loaded chapters to app's chapter structure if needed
      // Assuming LoadedSessionState.chapters and app's chapters (type Chapter[]) are compatible for now
      setChapters(loadedSession.chapters || []);

      setDetectedLanguage(loadedSession.detectedLanguage || 'english');

      if (loadedSession.fileName && loadedSession.fileType) {
        const file = new File(
          [new Blob([])], // Empty blob as content is not stored, only metadata
          loadedSession.fileName,
          {
            type: loadedSession.fileType,
            lastModified: loadedSession.lastModified || Date.now(),
          }
        );
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
      }
      setConversionInProgress(loadedSession.conversionInProgress || false);

      // Update snapshot after applying loaded state
      lastSavedSnapshotRef.current = createStateSnapshot(
        String(loadedSession.currentStep || 1),
        loadedSession.extractedText || '',
        JSON.stringify(loadedSession.chapters || []),
        loadedSession.detectedLanguage || 'english',
        String(loadedSession.conversionInProgress || false)
      );

      setIsInitialized(true); // Signal that app state is now initialized
      hasAppliedInitialLoadRef.current = true; // Mark that this effect has run
      console.log('useSessionStorage: App state initialized from session.');

      if (pendingSaveRef.current) {
        // If a save was pending because initialization wasn't complete
        saveSessionState();
        pendingSaveRef.current = false;
      }
    } else if (!isSessionLoading && !loadedSession && !hasAppliedInitialLoadRef.current) {
      // No session data was loaded, but loading attempt is complete
      console.log('useSessionStorage: No session data found, initializing app state as fresh.');
      setIsInitialized(true);
      hasAppliedInitialLoadRef.current = true;
    }
  }, [loadedSession, isSessionLoading, setCurrentStep, setExtractedText, setChapters, setDetectedLanguage, setSelectedFile, setConversionInProgress, setIsInitialized]);

  // Debounced save function for general app state
  const saveSessionState = useCallback(() => {
    if (isSessionLoading || !isInitialized || !hasAppliedInitialLoadRef.current) {
      // If session is currently loading, or app hasn't initialized from session yet, defer save.
      pendingSaveRef.current = true;
      console.log('useSessionStorage: Save deferred, session loading or not initialized.');
      return;
    }

    if (currentStep <= 1 && !selectedFile) { // Adjusted condition slightly
      if (sessionStorage.length > 0) { // Only clear if there's something to clear
         console.log('useSessionStorage: Clearing session storage as app is in initial state.');
         clearStorageDataUtils(); // Utility to clear all session keys used by this app part
         lastSavedSnapshotRef.current = ''; // Reset snapshot
      }
      return;
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;

      try {
        saveToSessionStorage({ // This is the actual save call
          currentStep,
          extractedText,
          chapters,
          detectedLanguage,
          selectedFile,
          conversionInProgress,
          lastSavedState: lastSavedSnapshotRef // Pass the ref itself
        });
        // saveToSessionStorage updates lastSavedSnapshotRef.current internally
        pendingSaveRef.current = false;
      } catch (err) {
        console.error('useSessionStorage: Error saving to sessionStorage:', err);
        toast({
          title: "Save Error",
          description: "Failed to save your progress.",
          variant: "destructive",
        });
      } finally {
        saveTimeoutRef.current = null;
      }
    }, 1000);
  }, [
    currentStep, selectedFile, extractedText, chapters, detectedLanguage, conversionInProgress,
    isSessionLoading, isInitialized, toast // Dependencies for save logic
  ]);

  // Effect for component lifecycle
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Effect to trigger save when relevant app state changes
  useEffect(() => {
    if (isInitialized && hasAppliedInitialLoadRef.current) { // Only save after initial load has been applied
      saveSessionState();
    }
  }, [
    isInitialized, currentStep, selectedFile, extractedText, chapters,
    detectedLanguage, conversionInProgress, saveSessionState
  ]);

  // Function to clear the general app state from session storage
  const clearGeneralAppStateFromStorage = useCallback(() => {
    console.log('useSessionStorage: Clearing all general app session storage data');
    clearStorageDataUtils();
    // Reset local app state
    setSelectedFile(null);
    setExtractedText('');
    setChapters([]);
    setCurrentStep(1);
    setDetectedLanguage('english');
    setConversionInProgress(false);
    setIsInitialized(true); // Consider it initialized to a fresh state
    lastSavedSnapshotRef.current = '';
    pendingSaveRef.current = false;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    toast({ title: "Session Cleared", description: "Your session data has been cleared." });
  }, [
    setSelectedFile, setExtractedText, setChapters, setCurrentStep,
    setDetectedLanguage, setConversionInProgress, setIsInitialized, toast
  ]);

  // --- Placeholder implementations for UseSessionStorageReturn (explicit session object management) ---
  const initializeSession = useCallback(async (file: File): Promise<string> => {
    const newSessionId = `session_${Date.now()}_${file.name.substring(0,10)}`;
    const initialSessionData: SessionState = {
      currentSessionId: newSessionId, isActive: true, chapters: [],
      originalFileName: file.name, audioSourceUrl: undefined,
    };
    setCurrentSessionObject(initialSessionData);
    setIsSessionObjectReady(true);
    setSessionObjectError(null);
    try {
      localStorage.setItem(newSessionId, JSON.stringify(initialSessionData)); // Using localStorage for these objects for clarity
    } catch (e) {
      setSessionObjectError('Failed to save session object.');
    }
    return newSessionId;
  }, []);

  const updateSession = useCallback(async (newState: Partial<SessionState>): Promise<boolean> => {
    if (!currentSessionObject || !currentSessionObject.currentSessionId) {
      setSessionObjectError("No active session object to update."); return false;
    }
    const updatedSession = { ...currentSessionObject, ...newState };
    setCurrentSessionObject(updatedSession);
    try {
      localStorage.setItem(currentSessionObject.currentSessionId, JSON.stringify(updatedSession));
    } catch (e) {
      setSessionObjectError('Failed to save updated session object.'); return false;
    }
    return true;
  }, [currentSessionObject]);

  const loadSession = useCallback(async (sessionId: string): Promise<SessionState | null> => {
    setIsSessionObjectReady(false);
    try {
      const stored = localStorage.getItem(sessionId);
      if (stored) {
        const parsed = JSON.parse(stored) as SessionState;
        setCurrentSessionObject(parsed);
        setIsSessionObjectReady(true);
        return parsed;
      } else {
        setSessionObjectError("Session object not found."); setCurrentSessionObject(null); return null;
      }
    } catch (e) {
      setSessionObjectError('Failed to load session object.'); setCurrentSessionObject(null); return null;
    }
  }, []);

  const clearSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      localStorage.removeItem(sessionId);
      if (currentSessionObject && currentSessionObject.currentSessionId === sessionId) {
        setCurrentSessionObject(null); setIsSessionObjectReady(false);
      }
      return true;
    } catch (e) {
      setSessionObjectError('Failed to clear session object.'); return false;
    }
  }, [currentSessionObject]);

  // This hook now has two roles:
  // 1. Auto-saving/loading general app state (text, chapters, currentStep, etc.) to sessionStorage.
  // 2. Providing methods to manage explicit, named SessionState objects (in localStorage for this example).
  // The `clearSessionStorageData` prop in the original return is replaced by `clearGeneralAppStateFromStorage`
  // to avoid name clash if `clearSession` was intended for the explicit session objects.

  // The public interface `UseSessionStorageReturn` refers to the explicit session object management.
  // The general app state persistence is an internal behavior of this hook.
  // The props like `selectedFile`, `extractedText` etc. are NOT part of UseSessionStorageReturn.
  // This is a bit of a hybrid hook now. The subtask asks to update useSessionStorage.ts
  // to *consume* the refactored useSessionLoad, which it does for general app state.
  // The return type UseSessionStorageReturn is from a previous step.

  return {
    sessionState: currentSessionObject,
    isSessionReady: isSessionObjectReady,
    sessionError: sessionObjectError,
    initializeSession,
    updateSession,
    loadSession,
    clearSession,
    // clearGeneralAppState: clearGeneralAppStateFromStorage, // Expose this if needed by UI
  };
};
