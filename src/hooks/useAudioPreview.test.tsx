
import { renderHook, act } from '@testing-library/react';
import { useAudioPreview } from './useAudioPreview';
import { supabase } from "@/integrations/supabase/client";
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

// Create a typed mock audio interface
interface MockAudio extends Partial<HTMLAudioElement> {
  play: jest.Mock;
  pause: jest.Mock;
  onended: (() => void) | null;
  onerror: ((e: Event) => void) | null;
  src: string;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
}

// Create mock audio with required properties
const createMockAudio = (): MockAudio => ({
  play: vi.fn(),
  pause: vi.fn(),
  onended: null,
  onerror: null,
  src: '',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
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
});

const mockAudio = createMockAudio();

// Setup global mocks
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockAtob = vi.fn();

// Define window interface for type safety
declare global {
  interface Window {
    Audio: new () => MockAudio;
    URL: {
      createObjectURL(obj: Blob | MediaSource): string;
      revokeObjectURL(url: string): void;
      parse(url: string): URL;
    };
  }
}

// Setup global mocks
const MockAudio = vi.fn(() => mockAudio);

vi.stubGlobal('Audio', MockAudio);
vi.stubGlobal('URL', {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
  prototype: {} as URL,
  canParse: () => false,
  parse: (url: string) => new URL(url)
});
vi.stubGlobal('atob', mockAtob);

describe('useAudioPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAudio.onended = null;
    mockAudio.onerror = null;
    mockAudio.play.mockReset();
  });

  it('should handle successful audio preview', async () => {
    const mockAudioContent = 'mock-audio-content';
    mockAtob.mockReturnValue('binary-data');
    
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { audioContent: mockAudioContent },
      error: null
    });

    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    mockAudio.play.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAudioPreview());
    expect(result.current.isPlaying).toBe(null);

    await act(async () => {
      await result.current.playPreview('en-US-Standard-C');
    });

    act(() => {
      mockAudio.onended?.();
    });

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(result.current.isPlaying).toBe(null);
  });

  it('should handle API error with quota exceeded', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'quota exceeded' }
    });

    const { result } = renderHook(() => useAudioPreview());

    await act(async () => {
      await result.current.playPreview('en-US-Standard-C');
    });

    expect(result.current.isPlaying).toBe(null);
    expect(mockAudio.play).not.toHaveBeenCalled();
  });

  it('should handle audio playback error', async () => {
    const mockAudioContent = 'mock-audio-content';
    
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { audioContent: mockAudioContent },
      error: null
    });

    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    mockAudio.play.mockRejectedValue(new Error('Audio playback failed'));

    const { result } = renderHook(() => useAudioPreview());

    await act(async () => {
      await result.current.playPreview('en-US-Standard-C');
    });

    const errorEvent = new Event('error');
    act(() => {
      mockAudio.onerror?.(errorEvent);
    });

    expect(result.current.isPlaying).toBe(null);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
