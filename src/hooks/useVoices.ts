
import { useMemo } from 'react';
import { VOICES } from '@/constants/voices';
import { VoiceOption } from '@/types/conversion';

export function useVoices(language: string = 'english') {
  const voices = useMemo(() => {
    // Get the voices for the selected language or default to English
    const languageVoices = VOICES[language as keyof typeof VOICES] || VOICES.english;
    
    // Map the voices to the format expected by VoiceSelector
    return languageVoices.map(voice => ({
      id: voice.id,
      name: voice.label,
      language: language,
    })) as VoiceOption[];
  }, [language]);

  return { voices };
}
