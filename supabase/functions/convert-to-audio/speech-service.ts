
export async function synthesizeSpeech(text: string, voiceId: string, accessToken: string): Promise<string> {
  console.log('Starting speech synthesis with voice:', voiceId);
  
  // Split text into chunks if it's too long (5000 characters limit for Google TTS)
  const MAX_CHARS = 5000;
  const textChunks = [];
  for (let i = 0; i < text.length; i += MAX_CHARS) {
    textChunks.push(text.slice(i, i + MAX_CHARS));
  }
  
  try {
    const results = await Promise.all(textChunks.map(async (chunk) => {
      const requestBody = {
        input: {
          ssml: `<speak>${chunk}</speak>`
        },
        voice: {
          languageCode: voiceId.split('-')[0] + '-' + voiceId.split('-')[1], // e.g., "en-US"
          name: voiceId,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
          volumeGainDb: 0.0,
        }
      };

      console.log('Making request to Text-to-Speech API...');
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
        console.error('Speech API error response:', errorText);
        throw new Error(`Speech API failed: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      return data.audioContent;
    }));

    // Combine all audio chunks
    const combinedAudioContent = results.join('');
    console.log('Successfully synthesized speech');
    return combinedAudioContent;
    
  } catch (error) {
    console.error('Speech synthesis error:', error);
    throw error;
  }
}

