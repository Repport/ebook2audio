
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
const resend = new Resend(resendApiKey)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { conversion_id } = await req.json()

    // Get conversion and notification details
    const { data: notification, error: notificationError } = await supabase
      .from('conversion_notifications')
      .select('*, text_conversions(*)')
      .eq('conversion_id', conversion_id)
      .eq('status', 'pending')
      .single()

    if (notificationError || !notification) {
      throw new Error('Notification not found')
    }

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: 'Lovable <onboarding@resend.dev>',
      to: [notification.email],
      subject: 'Your Audio Conversion is Ready!',
      html: `
        <h1>Your Audio Conversion is Complete!</h1>
        <p>Your file "${notification.text_conversions.file_name}" has been successfully converted to audio.</p>
        <p>You can now download it from your conversions page.</p>
        <p>Best regards,<br>The Lovable Team</p>
      `,
    })

    // Update notification status
    const { error: updateError } = await supabase
      .from('conversion_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', notification.id)

    if (updateError) {
      throw updateError
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error sending notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
