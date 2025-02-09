
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getAccessToken } from "../preview-voice/auth.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple XOR-based obfuscation
function deobfuscateData(data: string): string {
  const key = 'epub2audio'; // Simple key for XOR operation
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function cleanText(text: string): string {
  return text
    .replace(/\n+/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/\[pdf\]/gi, '')
    .replace(/\[page\s*\d*\]/gi, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/([.!?])\s*(\w)/g, '$1 $2')
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      }
    });
  }

  try {
    const requestData = await req.json();
    // Deobfuscate the text and voiceId
    const text = requestData.text ? deobfuscateData(requestData.text) : '';
    const voiceId = requestData.voiceId ? deobfuscateData(requestData.voiceId) : 'en-US-Standard-C';
    const chapters = requestData.chapters;

    console.log('Request received with text length:', text.length, 'voice:', voiceId, 'chapters:', chapters?.length || 0);

    const accessToken = await getAccessToken();
    console.log('✅ Successfully obtained access token');

    const cleanedText = cleanText(text);
    console.log('Cleaned text sample:', cleanedText.substring(0, 100) + '...');
    
    if (!cleanedText) {
      throw new Error('No text content to convert');
    }

    // Add SSML markers for chapters if provided
    let ssmlText = cleanedText;
    if (chapters && chapters.length > 0) {
      ssmlText = `<speak>
        ${chapters.map((chapter, index) => {
          const nextIndex = index < chapters.length - 1 ? chapters[index + 1].timestamp : null;
          return `
            <mark name="chapter${index}"/>
            ${chapter.title && `<break time="1s"/><emphasis level="strong">${chapter.title}</emphasis><break time="1s"/>`}
            ${cleanedText.substring(chapter.startIndex, nextIndex !== null ? chapters[index + 1].startIndex : undefined)}
          `;
        }).join('\n')}
      </speak>`;
    }

    const requestBody = {
      input: { ssml: ssmlText },
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

    console.log('Making request to Google Cloud Text-to-Speech API...');
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
      console.error('Google Cloud API failed with status:', response.status);
      console.error('Error response:', errorText);
      throw new Error(`Google Cloud API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Audio data processed, sending response...');

    return new Response(
      JSON.stringify({ audioContent: data.audioContent }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Detailed conversion error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
