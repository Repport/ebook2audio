
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getAccessToken } from "../preview-voice/auth.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple XOR-based obfuscation
function deobfuscateData(data: string): string {
  const key = 'epub2audio' + new Date().getUTCDate();
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user information from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('Authenticated user:', user.id);

    // Get IP address from request
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    
    const requestData = await req.json();
    const text = requestData.text ? deobfuscateData(requestData.text) : '';
    const voiceId = requestData.voiceId ? deobfuscateData(requestData.voiceId) : 'en-US-Standard-C';
    const chapters = requestData.chapters;
    const fileName = requestData.fileName || 'untitled';

    console.log('Request received - IP:', ip, 'User:', user.id, 'File:', fileName);

    // Check rate limit using the database function
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_conversion_rate_limit', { p_ip_address: ip });

    if (rateLimitError || !rateLimitCheck) {
      throw new Error('Rate limit exceeded for this IP address');
    }

    const cleanedText = cleanText(text);
    console.log('Cleaned text sample:', cleanedText.substring(0, 100) + '...');
    
    if (!cleanedText) {
      throw new Error('No text content to convert');
    }

    // Add SSML markers for chapters if provided
    let ssmlText = cleanedText;
    if (chapters && chapters.length > 0) {
      ssmlText = `<speak>
        ${chapters.map((chapter: any, index: number) => {
          const nextIndex = index < chapters.length - 1 ? chapters[index + 1].timestamp : null;
          return `
            <mark name="chapter${index}"/>
            ${chapter.title && `<break time="1s"/><emphasis level="strong">${chapter.title}</emphasis><break time="1s"/>`}
            ${cleanedText.substring(chapter.startIndex, nextIndex !== null ? chapters[index + 1].startIndex : undefined)}
          `;
        }).join('\n')}
      </speak>`;
    }

    const accessToken = await getAccessToken();
    console.log('✅ Successfully obtained access token');

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
    
    // Log successful conversion
    const { error: logError } = await supabase
      .from('conversion_logs')
      .insert({
        user_id: user.id,
        ip_address: ip,
        file_name: fileName,
        file_size: text.length,
        successful: true
      });

    if (logError) {
      console.error('Error logging conversion:', logError);
    }

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
        status: error.message.includes('Rate limit') ? 429 : 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
