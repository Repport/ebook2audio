
import { useState } from 'react';

export interface VoiceSettingsOptions {
  initialVoice?: string;
  initialNotifyOnComplete?: boolean;
}

export function useVoiceSettings(options: VoiceSettingsOptions = {}) {
  const [selectedVoice, setSelectedVoice] = useState<string>(options.initialVoice || "");
  const [notifyOnComplete, setNotifyOnComplete] = useState<boolean>(options.initialNotifyOnComplete || false);
  
  return {
    selectedVoice,
    setSelectedVoice,
    notifyOnComplete,
    setNotifyOnComplete
  };
}
