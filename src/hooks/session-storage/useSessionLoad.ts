import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '../use-toast';
import {
  LoadedSessionState,
  UseSessionLoadReturn
} from '../../types/hooks/session';
import { Chapter } from '../../types/hooks/conversion';
import { createStateSnapshot } from './sessionStorageUtils';

/**
 * Hook for loading data from session storage.
 * This hook now manages its own state for the loaded session.
 */
export const useSessionLoad = (): UseSessionLoadReturn => {
  const [loadedSession, setLoadedSession] = useState<LoadedSessionState | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(false);
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);

  const hasLoadedInitialState = useRef(false); // Prevents re-loading
  const { toast } = useToast();
  // lastSavedState ref from original, might be useful for debugging or if useSessionLoad needs to expose it
  const lastLoadedSnapshot = useRef<string>('');

  useEffect(() => {
    if (hasLoadedInitialState.current) {
      return;
    }
    hasLoadedInitialState.current = true; // Mark that we've attempted loading once

    setIsSessionLoading(true);
    setSessionLoadError(null);

    try {
      console.log('useSessionLoad: Loading state from sessionStorage...');
      const savedStep = sessionStorage.getItem('currentStep');
      const savedText = sessionStorage.getItem('extractedText');
      const savedChaptersJson = sessionStorage.getItem('chapters'); // Keep as JSON string for snapshot
      const savedLanguage = sessionStorage.getItem('detectedLanguage');
      const savedFileName = sessionStorage.getItem('fileName');
      const savedFileType = sessionStorage.getItem('fileType');
      const savedFileLastModified = sessionStorage.getItem('fileLastModified');
      const savedFileSize = sessionStorage.getItem('fileSize');
      const savedConversionInProgress = sessionStorage.getItem('conversionInProgress');

      if (!savedStep && !savedText && !savedFileName) {
        console.log('useSessionLoad: No valid saved state found.');
        setLoadedSession(null); // Explicitly set to null if no session
      } else {
        console.log('useSessionLoad: Found saved state, proceeding with restore.');
        
        const parsedStep = savedStep ? parseInt(savedStep, 10) : undefined;
        const parsedChapters: Chapter[] = [];
        if (savedChaptersJson) {
          try {
            // TODO: This is a placeholder mapping. The actual structure from sessionStorage needs to be mapped
            // to the Chapter interface { id: string; title: string; startTime: number; endTime: number; }
            const loadedChaptersArray: any[] = JSON.parse(savedChaptersJson);
            loadedChaptersArray.forEach((chap, index) => {
              parsedChapters.push({
                id: chap.id || String(index + 1), // Use existing id or generate one
                title: chap.title || `Chapter ${index + 1}`,
                startTime: chap.startTime || 0, // Placeholder if not available
                endTime: chap.endTime || 0,     // Placeholder if not available
              });
            });
          } catch (err) {
            console.error('useSessionLoad: Error parsing saved chapters:', err);
            // Leave parsedChapters as empty array
          }
        }

        const sessionData: LoadedSessionState = {
          currentStep: parsedStep,
          extractedText: savedText || undefined,
          chapters: parsedChapters,
          detectedLanguage: savedLanguage || undefined,
          fileName: savedFileName || undefined,
          fileType: savedFileType || undefined,
          lastModified: savedFileLastModified ? parseInt(savedFileLastModified, 10) : undefined,
          fileSize: savedFileSize ? parseInt(savedFileSize, 10) : undefined,
          conversionInProgress: savedConversionInProgress === 'true',
          originalFileHash: undefined, // Not implemented yet
        };
        setLoadedSession(sessionData);

        if (sessionData.conversionInProgress) {
          toast({
            title: "Conversion Recovery",
            description: "Recovering from previous conversion state.",
            variant: "default",
            duration: 5000,
          });
        }
        
        // Update snapshot of what was loaded
        lastLoadedSnapshot.current = createStateSnapshot(
          savedStep || '', // Use empty string if null for snapshot consistency
          savedText || '',
          savedChaptersJson || '[]', // Use JSON string for snapshot
          savedLanguage || '',
          savedConversionInProgress || 'false'
        );
      }
    } catch (err: any) {
      console.error('useSessionLoad: Error loading from sessionStorage:', err);
      setSessionLoadError(err.message || 'Failed to load session from storage.');
      setLoadedSession(null);
    } finally {
      setIsSessionLoading(false);
      console.log('useSessionLoad: Finished loading attempt.');
    }
  }, [toast]); // toast is a stable function from useToast, safe for dep array

  // Placeholder implementations for explicit load/clear (not used by useSessionStorage currently)
  const loadSession = useCallback(async (sessionId: string): Promise<LoadedSessionState | null> => {
    console.warn(`loadSession by ID (${sessionId}) called but not implemented. Auto-loading on mount is default.`);
    setIsSessionLoading(true);
    setSessionLoadError(null);
    // This would typically fetch from a backend or specific localStorage key
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoadedSession(null); // Default to null for non-implemented targeted load
    setIsSessionLoading(false);
    setSessionLoadError("Targeted session loading is not implemented.");
    return null;
  }, []);

  const clearLoadedSession = useCallback(() => {
    console.warn('clearLoadedSession called but primarily affects local state. SessionStorage clearing should be separate.');
    setLoadedSession(null);
    // This does not clear sessionStorage itself, only the hook's state.
    // Actual clearing of sessionStorage is handled by useSessionSave or useSessionStorage.
  }, []);

  return {
    loadedSession,
    isSessionLoading,
    sessionLoadError,
    loadSession,
    clearLoadedSession,
  };
};
