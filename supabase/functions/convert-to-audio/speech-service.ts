
interface SynthesisResponse {
  audioContent: string;
}

export async function synthesizeSpeech(
  text: string,
  voiceId: string,
  accessToken: string
): Promise<string> {
  console.log(`Starting synthesis for text of length ${text.length} with voice ${voiceId}`);
  
  try {
    // Extract language code and voice name
    const [langRegion] = voiceId.split('-');
    const langCode = `${langRegion}-${langRegion.toUpperCase()}`;

    console.log(`Using language code: ${langCode}, voice: ${voiceId}`);

    const requestBody = {
      input: { text },
      voice: {
        languageCode: langCode,
        name: voiceId,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
      },
    };

    console.log('Sending request to Google TTS API:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google TTS API error:', errorText);
      console.error('Response status:', response.status);
      console.error('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
      throw new Error(`Speech synthesis failed: ${response.status} ${response.statusText}\nDetails: ${errorText}`);
    }

    const result: SynthesisResponse = await response.json();
    
    if (!result.audioContent) {
      console.error('No audio content in response:', JSON.stringify(result, null, 2));
      throw new Error('No audio content received from Google TTS');
    }

    console.log('Successfully synthesized speech');
    return result.audioContent;

  } catch (error) {
    console.error('Error in synthesizeSpeech:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      voiceId,
      textLength: text.length,
    });
    throw error;
  }
}
