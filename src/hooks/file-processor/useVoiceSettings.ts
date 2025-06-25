
import { useState } from 'react';

export const useVoiceSettings = () => {
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [notifyOnComplete, setNotifyOnComplete] = useState<boolean>(false);

  return {
    selectedVoice,
    setSelectedVoice,
    notifyOnComplete,
    setNotifyOnComplete
  };
};
