
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

// Maximum request size (in bytes) - 30MB to stay well under Supabase's 50MB limit
export const MAX_REQUEST_SIZE = 30 * 1024 * 1024;
