
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getAccessToken } from "../preview-voice/auth.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Maximum request size (in bytes) - 40MB to stay well under Supabase's 50MB limit
const MAX_REQUEST_SIZE = 40 * 1024 * 1024;

function deobfuscateData(data: string): string {
  const key = 'epub2audio';
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

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function synthesizeLongAudio(text: string, voiceId: string, accessToken: string): Promise<string> {
  // Step 1: Create a synthesis request
  const requestBody = {
    input: {
      ssml: `<speak>${escapeXml(text)}</speak>`
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

  // Create synthesis operation
  const operationResponse = await fetch(
    'https://texttospeech.googleapis.com/v1/text:longRunningRecognize',
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
    console.error('Long Audio API failed:', errorText);
    throw new Error(`Long Audio API failed: ${operationResponse.status} ${operationResponse.statusText}`);
  }

  const operation = await operationResponse.json();
  console.log('Operation created:', operation.name);

  // Step 2: Poll the operation until it's complete
  let audioContent = '';
  let isComplete = false;
  while (!isComplete) {
    const checkResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/operations/${operation.name}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!checkResponse.ok) {
      throw new Error(`Failed to check operation status: ${checkResponse.status}`);
    }

    const status = await checkResponse.json();
    console.log('Operation status:', status.done ? 'complete' : 'in progress');

    if (status.done) {
      if (status.error) {
        throw new Error(`Synthesis failed: ${status.error.message}`);
      }
      audioContent = status.response.audioContent;
      isComplete = true;
    } else {
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return audioContent;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentLength = parseInt(req.headers.get('content-length') || '0');
    if (contentLength > MAX_REQUEST_SIZE) {
      throw new Error(`Request size (${contentLength} bytes) exceeds maximum allowed size (${MAX_REQUEST_SIZE} bytes)`);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    
    const requestData = await req.json();
    const text = requestData.text ? deobfuscateData(requestData.text) : '';
    const voiceId = requestData.voiceId ? deobfuscateData(requestData.voiceId) : 'en-US-Standard-C';
    const fileName = requestData.fileName;

    console.log('Request received - IP:', ip, 'User:', user.id, 'File:', fileName);

    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_conversion_rate_limit', { p_ip_address: ip });

    if (rateLimitError || !rateLimitCheck) {
      throw new Error('Rate limit exceeded for this IP address');
    }

    const cleanedText = cleanText(text);
    if (!cleanedText) {
      throw new Error('No text content to convert');
    }

    const accessToken = await getAccessToken();
    console.log('✅ Successfully obtained access token');

    // Use Long Audio API for synthesis
    const audioContent = await synthesizeLongAudio(cleanedText, voiceId, accessToken);
    
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

    return new Response(
      JSON.stringify({ audioContent }),
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
