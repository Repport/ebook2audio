
import { useMemo } from 'react';
import { VOICES } from '@/constants/voices';
import { VoiceOption } from '@/types/conversion';

export function useVoices(language: string = 'english') {
  const voices = useMemo(() => {
    try {
      // Ensure language is a valid string
      const safeLanguage = typeof language === 'string' ? language : 'english';
      
      // Get the voices for the selected language or default to English
      const languageVoices = VOICES[safeLanguage as keyof typeof VOICES] || VOICES.english;
      
      // Ensure languageVoices is an array before mapping
      if (!Array.isArray(languageVoices)) {
        console.error('Expected voices to be an array, got:', languageVoices);
        return [];
      }
      
      // Map the voices to the format expected by VoiceSelector
      return languageVoices.map(voice => ({
        id: voice.id,
        name: voice.label,
        language: safeLanguage,
      })) as VoiceOption[];
    } catch (error) {
      console.error('Error in useVoices hook:', error);
      return [];
    }
  }, [language]);

  return { voices };
}
