
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { Database } from '../_shared/database.types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting enhanced cleanup of expired conversions...')

    // Call the improved cleanup_expired function
    const { error } = await supabaseClient.rpc('cleanup_expired')

    if (error) {
      throw error
    }

    // Perform additional cleanup for system_logs table
    const { error: logsCleanupError } = await supabaseClient
      .from('system_logs')
      .delete()
      .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    if (logsCleanupError) {
      console.error('Error cleaning up old system logs:', logsCleanupError)
    }

    console.log('Cleanup completed successfully')
    
    return new Response(
      JSON.stringify({ 
        message: 'Enhanced cleanup completed successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error during cleanup:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
