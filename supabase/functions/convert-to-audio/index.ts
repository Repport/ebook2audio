
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getAccessToken } from "../preview-voice/auth.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, MAX_REQUEST_SIZE } from './constants.ts'
import { deobfuscateData, cleanText, escapeXml } from './text-utils.ts'
import { synthesizeSpeech } from './speech-service.ts'

const REQUEST_TIMEOUT = 60000; // 60 second timeout for the entire request

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

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

    console.log('Request received - IP:', ip, 'User:', user.id, 'File:', fileName, 'Text length:', text.length);

    // Calculate chunks for rate limiting if this is the first chunk of a conversion
    if (!isChunk) {
      const chunkCount = Math.ceil(text.length / 5000);
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

    // Generate a hash of the text and voice ID to check for existing conversions
    const textToHash = `${cleanedText}-${voiceId}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(textToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const textHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check if we already have this conversion
    console.log('Checking for existing conversion with hash:', textHash);
    const { data: existingConversion, error: cacheError } = await supabase
      .from('text_conversions')
      .select('storage_path, audio_content')
      .eq('text_hash', textHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cacheError) {
      console.error('Error checking cache:', cacheError);
    } else if (existingConversion) {
      console.log('Found existing conversion, returning cached audio');
      return new Response(
        JSON.stringify({ data: { audioContent: existingConversion.audio_content } }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json'
          } 
        }
      );
    }

    // If no cached version exists, proceed with new conversion
    console.log('No cached version found, proceeding with new conversion');
    console.log('Getting access token...');
    const accessToken = await getAccessToken();
    console.log('✅ Successfully obtained access token');

    console.log('Starting speech synthesis...');
    const escapedText = escapeXml(cleanedText);
    const audioContent = await synthesizeSpeech(escapedText, voiceId, accessToken);
    
    if (!audioContent) {
      console.error('No audio content received from speech synthesis');
      throw new Error('Speech synthesis failed to generate audio content');
    }
    
    console.log('✅ Successfully synthesized speech, audio content length:', audioContent.length);
    
    // Store the new conversion
    const { error: insertError } = await supabase
      .from('text_conversions')
      .insert({
        text_hash: textHash,
        audio_content: audioContent,
        file_name: fileName,
        file_size: audioContent.length,
        user_id: user.id
      });

    if (insertError) {
      console.error('Error storing conversion:', insertError);
    }
    
    // Log successful conversion
    const { error: logError } = await supabase
      .from('conversion_logs')
      .insert({
        user_id: user.id,
        ip_address: ip,
        file_name: fileName,
        file_size: text.length,
        successful: true,
        chunk_count: isChunk ? null : Math.ceil(text.length / 5000)
      });

    if (logError) {
      console.error('Error logging conversion:', logError);
    }

    clearTimeout(timeoutId);

    return new Response(
      JSON.stringify({ data: { audioContent } }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Detailed conversion error:', error);

    const statusCode = error.message.includes('Rate limit') ? 429 :
                      error.message.includes('Unauthorized') ? 401 :
                      error.message.includes('timeout') ? 504 :
                      500;

    return new Response(
      JSON.stringify({ 
        error: error.message,
        retryAfter: statusCode === 429 ? 3600 : undefined // 1 hour retry for rate limits
      }),
      { 
        status: statusCode,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          ...(statusCode === 429 ? { 'Retry-After': '3600' } : {})
        }
      }
    );
  }
});
