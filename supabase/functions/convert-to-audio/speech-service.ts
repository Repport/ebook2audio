
export async function synthesizeSpeech(text: string, voiceId: string, accessToken: string): Promise<string> {
  console.log('Starting speech synthesis with voice:', voiceId);
  
  // Split text into chunks of characters, respecting word boundaries
  const MAX_CHARS = 4500; // Leave some room for SSML tags
  const words = text.split(/\s+/);
  const textChunks: string[] = [];
  let currentChunk = '';
  
  for (const word of words) {
    if ((currentChunk + ' ' + word).length > MAX_CHARS) {
      textChunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + word;
    }
  }
  if (currentChunk) {
    textChunks.push(currentChunk.trim());
  }
  
  console.log(`Split text into ${textChunks.length} chunks`);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  async function processChunkWithRetry(chunk: string, index: number, retryCount = 0): Promise<string> {
    try {
      // Escape special characters in the text
      const escapedChunk = chunk
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      const requestBody = {
        input: {
          ssml: `<speak>${escapedChunk}</speak>`
        },
        voice: {
          languageCode: voiceId.split('-')[0] + '-' + voiceId.split('-')[1],
          name: voiceId,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
          volumeGainDb: 0.0,
        }
      };

      console.log(`Processing chunk ${index + 1}/${textChunks.length} (${chunk.length} characters), attempt ${retryCount + 1}`);
      
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
        console.error(`Error processing chunk ${index + 1} (attempt ${retryCount + 1}):`, errorText);
        
        // If we haven't exceeded max retries and it's a 500 error, retry
        if (retryCount < MAX_RETRIES && (response.status === 500 || response.status === 503)) {
          console.log(`Retrying chunk ${index + 1} after ${RETRY_DELAY}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return processChunkWithRetry(chunk, index, retryCount + 1);
        }
        
        throw new Error(`Speech API failed: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      console.log(`Successfully processed chunk ${index + 1}`);
      return data.audioContent;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying chunk ${index + 1} after error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return processChunkWithRetry(chunk, index, retryCount + 1);
      }
      throw error;
    }
  }
  
  try {
    const results = await Promise.all(
      textChunks.map((chunk, index) => processChunkWithRetry(chunk, index))
    );

    // Combine all audio chunks
    const combinedAudioContent = results.join('');
    console.log(`Successfully synthesized speech from ${textChunks.length} chunks`);
    return combinedAudioContent;
    
  } catch (error) {
    console.error('Speech synthesis error:', error);
    throw error;
  }
}
