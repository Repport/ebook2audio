// Assuming Chapter is imported from an appropriate path.
// For now, using a placeholder or assuming it's in scope.
import { Chapter } from './conversion'; // Or wherever Chapter is defined

export interface LoadedSessionState {
  chapters: Chapter[];
  originalFileHash?: string; // Hash of the original file to check for changes
  lastModified?: number; // Timestamp
  // other fields that represent a loaded session
  currentStep?: number;
  extractedText?: string;
  detectedLanguage?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  conversionInProgress?: boolean;
}

export interface UseSessionLoadReturn {
  loadedSession: LoadedSessionState | null;
  isSessionLoading: boolean;
  sessionLoadError: string | null;
  loadSession: (sessionId: string) => Promise<LoadedSessionState | null>; // Example load function
  clearLoadedSession: () => void;
}

export interface SessionState {
  currentSessionId: string | null;
  isActive: boolean;
  chapters: Chapter[];
  // Potentially include things like conversion options if they are part of the session
  // conversionOptions?: ConversionOptions; // Example
  audioSourceUrl?: string; // URL or path to the audio file
  originalFileName?: string;
}

export interface UseSessionStorageReturn {
  sessionState: SessionState | null;
  initializeSession: (file: File) => Promise<string>; // Returns a session ID
  updateSession: (newState: Partial<SessionState>) => Promise<boolean>;
  loadSession: (sessionId: string) => Promise<SessionState | null>;
  clearSession: (sessionId: string) => Promise<boolean>;
  isSessionReady: boolean;
  sessionError: string | null;
}
