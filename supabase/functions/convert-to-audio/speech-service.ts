
interface SynthesisResponse {
  audioContent: string;
}

export async function synthesizeSpeech(
  text: string,
  voiceId: string,
  accessToken: string
): Promise<string> {
  console.log(`Starting speech synthesis for text of length ${text.length} with voice ${voiceId}`);
  
  try {
    // Extract language code from voiceId (e.g., "es-US-Standard-A" -> "es-US")
    const langCode = voiceId.split('-').slice(0, 2).join('-');
    console.log(`Using language code: ${langCode}`);

    // Validate text length
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(text);
    console.log(`Text bytes length: ${textBytes.length}`);

    if (textBytes.length > 5000) {
      console.error(`Text exceeds maximum length: ${textBytes.length} bytes`);
      throw new Error(`Text exceeds maximum length of 5000 bytes (current: ${textBytes.length} bytes)`);
    }

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
        sampleRateHertz: 24000,
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
    throw error;
  }
}
