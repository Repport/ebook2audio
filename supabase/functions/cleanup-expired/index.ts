
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { Database } from '../_shared/database.types.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
    console.log('Starting enhanced cleanup of expired conversions...')

    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Call the improved cleanup_expired function
    const { error: cleanupError } = await supabaseClient.rpc('cleanup_expired')

    if (cleanupError) {
      console.error('Error in cleanup_expired RPC:', cleanupError)
      throw new Error(`Cleanup RPC failed: ${cleanupError.message}`)
    }

    console.log('Successfully executed cleanup_expired RPC')

    // Perform additional cleanup for system_logs table with better error handling
    const oldestLogDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    console.log(`Cleaning system_logs older than ${oldestLogDate.toISOString()}`)

    const { error: logsCleanupError, count } = await supabaseClient
      .from('system_logs')
      .delete({ count: 'exact' })
      .lt('created_at', oldestLogDate.toISOString())

    if (logsCleanupError) {
      console.error('Error cleaning up old system logs:', logsCleanupError)
      // Continue execution despite error in logs cleanup
    } else {
      console.log(`Successfully removed ${count || 0} old system logs`)
    }

    // Log the execution time
    const executionTime = Date.now() - startTime
    console.log(`Cleanup completed successfully in ${executionTime}ms`)
    
    // Track this cleanup operation in system_logs
    await supabaseClient.from('system_logs').insert({
      event_type: 'maintenance',
      details: { 
        operation: 'cleanup_expired',
        execution_time_ms: executionTime,
        logs_cleaned: count || 0
      },
      status: 'success'
    })
    
    return new Response(
      JSON.stringify({ 
        message: 'Enhanced cleanup completed successfully',
        timestamp: new Date().toISOString(),
        execution_time_ms: executionTime,
        logs_cleaned: count || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error during cleanup:', error)

    // Log the failure in system_logs
    try {
      const supabaseClient = createClient<Database>(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      await supabaseClient.from('system_logs').insert({
        event_type: 'maintenance',
        details: { 
          operation: 'cleanup_expired',
          error: error.message,
          stack: error.stack
        },
        status: 'error'
      })
    } catch (logError) {
      console.error('Failed to log error to system_logs:', logError)
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
