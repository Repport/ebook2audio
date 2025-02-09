
export async function synthesizeSpeech(text: string, voiceId: string, accessToken: string): Promise<string> {
  console.log('Starting speech synthesis...');
  
  const requestBody = {
    input: {
      ssml: `<speak>${text}</speak>`
    },
    voice: {
      languageCode: 'en-US',
      name: voiceId,
      ssmlGender: voiceId.includes('Standard-C') ? 'FEMALE' : 'MALE'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
      pitch: 0.0,
      effectsProfileId: ['handset-class-device'],
    }
  };

  const operationResponse = await fetch(
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

  if (!operationResponse.ok) {
    const errorText = await operationResponse.text();
    console.error('Speech API failed:', errorText);
    throw new Error(`Speech API failed: ${operationResponse.status} ${operationResponse.statusText}`);
  }

  const data = await operationResponse.json();
  console.log('Successfully synthesized audio');
  
  return data.audioContent;
}
