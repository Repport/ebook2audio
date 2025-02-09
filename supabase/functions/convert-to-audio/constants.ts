
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum request size (in bytes) - 40MB to stay well under Supabase's 50MB limit
export const MAX_REQUEST_SIZE = 40 * 1024 * 1024;
