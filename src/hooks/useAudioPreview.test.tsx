import { renderHook, act } from '@testing-library/react';
import { useAudioPreview } from './useAudioPreview';
import { supabase } from "@/integrations/supabase/client";
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// Mock the supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

// Mock the Audio API with minimal required properties
const mockAudio = {
  play: vi.fn(),
  pause: vi.fn(),
  onended: null as (() => void) | null,
  onerror: null as ((e: Event) => void) | null,
  src: '',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  // Add minimal required properties to satisfy HTMLAudioElement interface
  NETWORK_EMPTY: 0,
  NETWORK_IDLE: 1,
  NETWORK_LOADING: 2,
  NETWORK_NO_SOURCE: 3,
  HAVE_NOTHING: 0,
  HAVE_METADATA: 1,
  HAVE_CURRENT_DATA: 2,
  HAVE_FUTURE_DATA: 3,
  HAVE_ENOUGH_DATA: 4,
  error: null,
  networkState: 0,
  readyState: 0,
  seeking: false,
  currentTime: 0,
  duration: 0,
  paused: true,
  ended: false,
} as unknown as HTMLAudioElement;

// Setup global mocks
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockAtob = vi.fn();

// Define global types for the mocks
declare global {
  var Audio: {
    new (src?: string): HTMLAudioElement;
  };
  var URL: {
    createObjectURL(obj: Blob | MediaSource): string;
    revokeObjectURL(url: string): void;
  };
}

// Assign mocks to global object
globalThis.Audio = vi.fn(() => mockAudio) as unknown as { new (src?: string): HTMLAudioElement };
globalThis.URL = {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL
};
vi.stubGlobal('atob', mockAtob);

describe('useAudioPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAudio.play.mockReset();
    mockAudio.onended = null;
    mockAudio.onerror = null;
  });

  it('should handle successful audio preview', async () => {
    const mockAudioContent = 'mock-audio-content';
    const mockVoiceId = 'test-voice-id';
    
    // Mock the base64 to binary conversion
    mockAtob.mockReturnValue('binary-data');
    
    // Mock successful API response
    (supabase.functions.invoke as Mock).mockResolvedValue({
      data: { audioContent: mockAudioContent },
      error: null
    });

    // Mock URL creation
    mockCreateObjectURL.mockReturnValue('blob:mock-url');

    // Mock successful audio playback
    mockAudio.play.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAudioPreview());

    // Verify initial state
    expect(result.current.isPlaying).toBe(null);

    // Trigger preview
    await act(async () => {
      await result.current.playPreview(mockVoiceId);
    });

    // Verify API call
    expect(supabase.functions.invoke).toHaveBeenCalledWith('preview-voice', {
      body: { voiceId: mockVoiceId }
    });

    // Verify audio setup
    expect(globalThis.Audio).toHaveBeenCalledWith('blob:mock-url');
    expect(mockAudio.play).toHaveBeenCalled();

    // Simulate playback end
    act(() => {
      if (mockAudio.onended) mockAudio.onended();
    });

    // Verify cleanup
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(result.current.isPlaying).toBe(null);
  });

  it('should handle API error with quota exceeded', async () => {
    const mockVoiceId = 'test-voice-id';
    
    // Mock API error response
    (supabase.functions.invoke as Mock).mockResolvedValue({
      data: null,
      error: { message: 'quota exceeded' }
    });

    const { result } = renderHook(() => useAudioPreview());

    // Trigger preview
    await act(async () => {
      await result.current.playPreview(mockVoiceId);
    });

    // Verify error handling
    expect(result.current.isPlaying).toBe(null);
    expect(mockAudio.play).not.toHaveBeenCalled();
  });

  it('should handle audio playback error', async () => {
    const mockAudioContent = 'mock-audio-content';
    const mockVoiceId = 'test-voice-id';
    
    // Mock successful API response
    (supabase.functions.invoke as Mock).mockResolvedValue({
      data: { audioContent: mockAudioContent },
      error: null
    });

    // Mock URL creation
    mockCreateObjectURL.mockReturnValue('blob:mock-url');

    // Mock failed audio playback
    mockAudio.play.mockRejectedValue(new Error('Audio playback failed'));

    const { result } = renderHook(() => useAudioPreview());

    // Trigger preview
    await act(async () => {
      await result.current.playPreview(mockVoiceId);
    });

    // Verify error handling
    expect(result.current.isPlaying).toBe(null);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});