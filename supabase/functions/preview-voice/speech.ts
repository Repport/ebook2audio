
export interface TextToSpeechRequest {
  input: {
    text: string;
  };
  voice: {
    languageCode: string;
    name: string;
    ssmlGender: string;
  };
  audioConfig: {
    audioEncoding: string;
    speakingRate: number;
    pitch: number;
  };
}

export interface VoiceParameters {
  languageCode: string;
  ssmlGender: string;
}

export function parseVoiceId(voiceId: string): VoiceParameters {
  const languageCode = voiceId.split('-').slice(0, 2).join('-');
  const ssmlGender = voiceId.endsWith('C') ? 'FEMALE' : 'MALE';
  return { languageCode, ssmlGender };
}

export async function synthesizeSpeech(accessToken: string, requestBody: TextToSpeechRequest): Promise<Response> {
  const response = await fetch(
    'https://texttospeech.googleapis.com/v1/text:synthesize',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Cloud API error:', {
      status: response.status,
      error: errorText
    });
    throw new Error(`Google Cloud API failed: ${response.status} ${response.statusText}`);
  }

  return response;
}
