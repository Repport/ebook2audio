
interface SynthesisResponse {
  audioContent: string;
}

export async function synthesizeSpeech(
  text: string,
  voiceId: string,
  accessToken: string
): Promise<string> {
  console.log(`Starting synthesis for text of length ${text.length}`);
  
  try {
    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: voiceId.split('-')[0] + '-' + voiceId.split('-')[1],
            name: voiceId,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google TTS API error:', errorText);
      throw new Error(`Speech synthesis failed: ${response.status} ${response.statusText}`);
    }

    const result: SynthesisResponse = await response.json();
    
    if (!result.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }

    console.log('Successfully synthesized speech');
    return result.audioContent;

  } catch (error) {
    console.error('Error in synthesizeSpeech:', error);
    throw error;
  }
}
