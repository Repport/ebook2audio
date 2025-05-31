
import { useCallback, useEffect, useState as ReactUseState, useRef } from 'react'; // Renamed useState to avoid conflict
import { useSessionState } from './session-storage/useSessionState';
import { useSessionLoad } from './session-storage/useSessionLoad';
import { saveToSessionStorage, clearSessionStorageData as clearStorageData } from './session-storage/useSessionSave';
import { useToast } from './use-toast';
import {
  SessionState,
  UseSessionStorageReturn
} from '../types/hooks/session'; // Adjusted path
import { Chapter } from '../types/hooks/conversion'; // Assuming Chapter is here

export const useSessionStorage = (): UseSessionStorageReturn => {
  // State for the new return type
  const [sessionState, setSessionState] = ReactUseState<SessionState | null>(null);
  const [isSessionReady, setIsSessionReady] = ReactUseState<boolean>(false);
  const [sessionError, setSessionError] = ReactUseState<string | null>(null);

  // Original refs and logic (will largely be disconnected from new return type)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const hasLoadedRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const { toast } = useToast();

  // Get state from useSessionState
  const {
    selectedFile,
    setSelectedFile,
    extractedText,
    setExtractedText,
    chapters,
    setChapters,
    currentStep,
    setCurrentStep,
    detectedLanguage,
    setDetectedLanguage,
    conversionInProgress,
    setConversionInProgress,
    isInitialized,
    setIsInitialized
  } = useSessionState();
  
  // Load from session storage - provides refs to track loading state
  const { isLoadingFromStorage, isInitialLoad, lastSavedState } = useSessionLoad(
    setCurrentStep,
    setExtractedText,
    setChapters,
    setDetectedLanguage,
    setSelectedFile,
    setConversionInProgress,
    setIsInitialized
  );

  // Save to session storage with debounce
  const saveSessionState = useCallback(() => {
    // Skip if initial load or loading from storage is in progress
    if (isLoadingFromStorage.current || !isInitialized || !hasLoadedRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    // Skip if no file is selected or we're on step 1
    if (currentStep <= 1 || !selectedFile) {
      if (currentStep <= 1) {
        console.log('Clearing session storage as we are on step 1');
        clearStorageData();
      }
      return;
    }

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save operations
    saveTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;

      try {
        console.log('Saving state to sessionStorage...');
        
        saveToSessionStorage({
          currentStep,
          extractedText,
          chapters,
          detectedLanguage,
          selectedFile,
          conversionInProgress,
          lastSavedState
        });
        
        console.log('State saved to sessionStorage successfully');
        pendingSaveRef.current = false;
      } catch (err) {
        console.error('Error saving to sessionStorage:', err);
        
        toast({
          title: "Save Error",
          description: "Failed to save your progress. Please try again.",
          variant: "destructive",
        });
      } finally {
        saveTimeoutRef.current = null;
      }
    }, 1000); // 1000ms debounce
  }, [
    currentStep,
    selectedFile,
    extractedText,
    chapters,
    detectedLanguage,
    conversionInProgress,
    isLoadingFromStorage,
    lastSavedState,
    isInitialized,
    toast
  ]);

  // Set loaded flag after component is mounted and initialized
  useEffect(() => {
    if (isInitialized && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      // If there was a pending save, do it now
      if (pendingSaveRef.current) {
        saveSessionState();
      }
    }
  }, [isInitialized, saveSessionState]);

  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Save state when any relevant state changes
  useEffect(() => {
    if (isInitialized && hasLoadedRef.current) {
      saveSessionState();
    }
  }, [
    isInitialized,
    currentStep,
    selectedFile,
    extractedText,
    chapters,
    detectedLanguage,
    conversionInProgress,
    saveSessionState
  ]);

  // Clear session storage data (using the imported function)
  const clearSessionStorageData = useCallback(() => {
    console.log('useSessionStorage: Clearing all session storage data');
    clearStorageData();
    
    // Reset the state
    setSelectedFile(null);
    setExtractedText('');
    setChapters([]);
    setCurrentStep(1);
    setDetectedLanguage('english');
    setConversionInProgress(false);
    
    // Reset the last saved state reference
    if (lastSavedState && typeof lastSavedState === 'object' && 'current' in lastSavedState) {
      (lastSavedState as { current: string }).current = '';
    }
  }, [
    setSelectedFile, 
    setExtractedText, 
    setChapters, 
    setCurrentStep, 
    setDetectedLanguage, 
    setConversionInProgress, 
    lastSavedState
  ]);

  return {
    selectedFile,
    setSelectedFile,
    extractedText,
    setExtractedText,
    chapters,
    setChapters,
    currentStep,
    setCurrentStep,
    detectedLanguage,
    setDetectedLanguage,
    conversionInProgress,
    setConversionInProgress,
    clearSessionStorageData,
  // Original state and load logic (from useSessionState, useSessionLoad)
  // This logic will continue to run but won't directly populate `sessionState`
  // without significant refactoring.
  const {
    selectedFile, setSelectedFile, extractedText, setExtractedText,
    chapters, setChapters, currentStep, setCurrentStep,
    detectedLanguage, setDetectedLanguage, conversionInProgress, setConversionInProgress,
    isInitialized, setIsInitialized
  } = useSessionState();

  useSessionLoad(
    setCurrentStep, setExtractedText, setChapters, setDetectedLanguage,
    setSelectedFile, setConversionInProgress, setIsInitialized
  );

  // Placeholder implementations for UseSessionStorageReturn methods
  const initializeSession = useCallback(async (file: File): Promise<string> => {
    console.log('initializeSession called with file:', file.name);
    setIsSessionReady(false);
    setSessionError(null);
    // Simulate session initialization
    await new Promise(resolve => setTimeout(resolve, 500));
    const newSessionId = `session_${Date.now()}`;
    const initialSession: SessionState = {
      currentSessionId: newSessionId,
      isActive: true,
      chapters: [], // Or derive from file if possible
      originalFileName: file.name,
      audioSourceUrl: undefined, // Placeholder
    };
    setSessionState(initialSession);
    setIsSessionReady(true);
    // This should also ideally save this initial state to sessionStorage/localStorage
    // using the new session ID as a key.
    sessionStorage.setItem(newSessionId, JSON.stringify(initialSession));
    return newSessionId;
  }, []);

  const updateSession = useCallback(async (newState: Partial<SessionState>): Promise<boolean> => {
    console.log('updateSession called with:', newState);
    if (!sessionState || !sessionState.currentSessionId) {
      setSessionError("No active session to update.");
      return false;
    }
    try {
      // Simulate update
      await new Promise(resolve => setTimeout(resolve, 300));
      setSessionState(prev => {
        const updated = prev ? { ...prev, ...newState } : null;
        if (updated && updated.currentSessionId) {
          sessionStorage.setItem(updated.currentSessionId, JSON.stringify(updated));
        }
        return updated;
      });
      return true;
    } catch (e: any) {
      setSessionError(e.message || "Failed to update session.");
      return false;
    }
  }, [sessionState]);

  const loadSession = useCallback(async (sessionId: string): Promise<SessionState | null> => {
    console.log('loadSession called with sessionId:', sessionId);
    setIsSessionReady(false);
    setSessionError(null);
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 700));
    try {
      const storedSession = sessionStorage.getItem(sessionId);
      if (storedSession) {
        const parsedSession: SessionState = JSON.parse(storedSession);
        setSessionState(parsedSession);
        setIsSessionReady(true);
        return parsedSession;
      } else {
        setSessionError("Session not found.");
        setSessionState(null);
        return null;
      }
    } catch (e: any) {
      setSessionError(e.message || "Failed to load session.");
      setSessionState(null);
      return null;
    }
  }, []);

  const clearSession = useCallback(async (sessionId: string): Promise<boolean> => {
    console.log('clearSession called for sessionId:', sessionId);
    try {
      sessionStorage.removeItem(sessionId);
      if (sessionState && sessionState.currentSessionId === sessionId) {
        setSessionState(null);
        setIsSessionReady(false);
      }
      return true;
    } catch (e: any) {
      setSessionError(e.message || "Failed to clear session.");
      return false;
    }
  }, [sessionState]);

  // TODO: The original hook's extensive logic for auto-saving individual items
  // to sessionStorage is not directly compatible with this new SessionState model.
  // A refactor would be needed to bridge these two approaches.
  // The original return value is also very different.
  return {
    sessionState,
    isSessionReady,
    sessionError,
    initializeSession,
    updateSession,
    loadSession,
    clearSession,
  };
};
