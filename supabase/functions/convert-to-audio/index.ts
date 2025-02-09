
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getAccessToken } from "../preview-voice/auth.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, MAX_REQUEST_SIZE } from './constants.ts'
import { deobfuscateData, cleanText, escapeXml } from './text-utils.ts'
import { synthesizeSpeech } from './speech-service.ts'

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
    const isChunk = requestData.isChunk || false;

    console.log('Request received - IP:', ip, 'User:', user.id, 'File:', fileName);

    // Calculate chunks for rate limiting if this is the first chunk of a conversion
    if (!isChunk) {
      const chunkCount = Math.ceil(text.length / 5000); // Using same chunk size as splitTextIntoChunks
      const { data: rateLimitCheck, error: rateLimitError } = await supabase
        .rpc('check_conversion_rate_limit', { 
          p_ip_address: ip,
          chunk_count: chunkCount
        });

      if (rateLimitError || !rateLimitCheck) {
        throw new Error('Rate limit exceeded for this IP address');
      }
    }

    const cleanedText = cleanText(text);
    if (!cleanedText) {
      throw new Error('No text content to convert');
    }

    const accessToken = await getAccessToken();
    console.log('✅ Successfully obtained access token');

    const escapedText = escapeXml(cleanedText);
    const audioContent = await synthesizeSpeech(escapedText, voiceId, accessToken);
    
    // Log successful conversion
    const { error: logError } = await supabase
      .from('conversion_logs')
      .insert({
        user_id: user.id,
        ip_address: ip,
        file_name: fileName,
        file_size: text.length,
        successful: true,
        chunk_count: isChunk ? null : Math.ceil(text.length / 5000) // Only log chunk count for full conversions
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
