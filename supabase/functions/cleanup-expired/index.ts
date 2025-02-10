
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

    console.log('Starting cleanup of expired conversions...')

    // First get the storage paths of expired conversions
    const { data: expiredConversions, error: fetchError } = await supabaseClient
      .from('text_conversions')
      .select('storage_path')
      .lt('expires_at', new Date().toISOString())
      .not('storage_path', 'is', null)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${expiredConversions?.length || 0} expired conversions`)

    // Delete files from storage
    for (const conversion of expiredConversions || []) {
      if (conversion.storage_path) {
        const { error: deleteError } = await supabaseClient
          .storage
          .from('audio_cache')
          .remove([conversion.storage_path])

        if (deleteError) {
          console.error(`Error deleting file ${conversion.storage_path}:`, deleteError)
        } else {
          console.log(`Deleted file: ${conversion.storage_path}`)
        }
      }
    }

    // Delete expired conversion records and their chunks
    const { error: deleteChunksError } = await supabaseClient
      .from('conversion_chunks')
      .delete()
      .in('conversion_id', 
        expiredConversions?.map(c => c.id) || []
      )

    if (deleteChunksError) {
      console.error('Error deleting chunks:', deleteChunksError)
    }

    const { error: deleteConversionsError } = await supabaseClient
      .from('text_conversions')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (deleteConversionsError) {
      console.error('Error deleting conversions:', deleteConversionsError)
    }

    return new Response(
      JSON.stringify({ 
        message: 'Cleanup completed', 
        deleted: expiredConversions?.length || 0 
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
