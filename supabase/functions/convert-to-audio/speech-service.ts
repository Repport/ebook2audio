
interface SynthesisResponse {
  audioContent: string;
}

function splitTextIntoChunks(text: string, maxBytes: number = 4900): string[] {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  const words = text.split(' ');
  let currentChunk = '';

  for (const word of words) {
    const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + word;
    if (encoder.encode(potentialChunk).length <= maxBytes) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = word;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  console.log(`Split text into ${chunks.length} chunks`);
  return chunks;
}

async function synthesizeChunk(
  text: string,
  voiceId: string,
  accessToken: string
): Promise<ArrayBuffer> {
  console.log(`Synthesizing chunk of length ${text.length}`);
  
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

    // Convert base64 to ArrayBuffer
    const binaryString = atob(result.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log('Successfully synthesized chunk');
    return bytes.buffer;
  } catch (error) {
    console.error('Error in synthesizeChunk:', error);
    throw error;
  }
}

export async function synthesizeSpeech(
  text: string,
  voiceId: string,
  accessToken: string
): Promise<string> {
  console.log(`Starting synthesis for text of length ${text.length} with voice ${voiceId}`);
  
  try {
    // Split text into chunks
    const chunks = splitTextIntoChunks(text);
    console.log(`Processing ${chunks.length} chunks`);

    // Process each chunk
    const audioBuffers: ArrayBuffer[] = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      const audioBuffer = await synthesizeChunk(chunks[i], voiceId, accessToken);
      audioBuffers.push(audioBuffer);
    }

    // Combine audio buffers
    const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.byteLength, 0);
    const combinedBuffer = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const buffer of audioBuffers) {
      combinedBuffer.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }

    // Convert combined buffer to base64
    let binary = '';
    const bytes = new Uint8Array(combinedBuffer.buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    console.log('Successfully combined all chunks');
    return btoa(binary);

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
