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

// Mock the Audio API
const mockAudio = {
  play: vi.fn(),
  pause: vi.fn(),
  onended: null as (() => void) | null,
  onerror: null as ((e: Event) => void) | null,
  src: ''
};

// Setup global mocks
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockAtob = vi.fn();

// Define global types for the mocks
declare global {
  interface Window {
    Audio: Mock;
    URL: {
      createObjectURL: typeof mockCreateObjectURL;
      revokeObjectURL: typeof mockRevokeObjectURL;
    };
  }
}

// Assign mocks to global object
window.Audio = vi.fn().mockImplementation(() => mockAudio);
window.URL.createObjectURL = mockCreateObjectURL;
window.URL.revokeObjectURL = mockRevokeObjectURL;
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
    expect(window.Audio).toHaveBeenCalledWith('blob:mock-url');
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