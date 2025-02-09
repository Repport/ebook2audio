
export async function synthesizeSpeech(text: string, voiceId: string, accessToken: string): Promise<string> {
  console.log('Starting speech synthesis with voice:', voiceId);
  
  const MAX_CHARS = 3000;
  const MAX_RETRIES = 5;
  const BASE_DELAY = 1000;
  const REQUEST_TIMEOUT = 30000;
  
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
  
  console.log(`Split text into ${textChunks.length} chunks for synthesis`);

  async function processChunkWithRetry(chunk: string, index: number, retryCount = 0): Promise<string> {
    try {
      const delay = retryCount > 0 ? 
        Math.min(BASE_DELAY * Math.pow(2, retryCount - 1) + Math.random() * 1000, 30000) : 
        0;

      if (delay > 0) {
        console.log(`Waiting ${delay}ms before retry ${retryCount} for chunk ${index + 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

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

      console.log(`Processing synthesis chunk ${index + 1}/${textChunks.length} (${chunk.length} characters), attempt ${retryCount + 1}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      try {
        const response = await fetch(
          'https://texttospeech.googleapis.com/v1/text:synthesize',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error processing chunk ${index + 1} (attempt ${retryCount + 1}):`, errorText);
          
          const shouldRetry = retryCount < MAX_RETRIES && (
            response.status === 500 || 
            response.status === 503 || 
            response.status === 429 || 
            response.status >= 500 || 
            response.status === 408 || 
            response.status === 409
          );

          if (shouldRetry) {
            console.log(`Retrying chunk ${index + 1} (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            return processChunkWithRetry(chunk, index, retryCount + 1);
          }
          
          throw new Error(`Speech API failed: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const data = await response.json();
        
        if (!data.audioContent) {
          throw new Error('No audio content in response');
        }

        // Clean the base64 string and ensure proper padding
        const cleanBase64 = data.audioContent.replace(/[^A-Za-z0-9+/]/g, '');
        const paddedBase64 = cleanBase64.padEnd(Math.ceil(cleanBase64.length / 4) * 4, '=');
        
        console.log(`Successfully processed synthesis chunk ${index + 1}`);
        return paddedBase64;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`Request timeout for chunk ${index + 1}`);
        if (retryCount < MAX_RETRIES) {
          return processChunkWithRetry(chunk, index, retryCount + 1);
        }
      }
      throw error;
    }
  }
  
  try {
    const results = [];
    for (let i = 0; i < textChunks.length; i++) {
      const result = await processChunkWithRetry(textChunks[i], i);
      results.push(result);
    }

    const combinedAudioContent = results.join('');
    console.log(`Successfully synthesized speech from ${textChunks.length} chunks`);
    return combinedAudioContent;
    
  } catch (error) {
    console.error('Speech synthesis error:', error);
    throw error;
  }
}

