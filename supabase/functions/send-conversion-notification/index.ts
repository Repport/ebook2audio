
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { Resend } from 'npm:resend@2.0.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
const resend = new Resend(resendApiKey)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders
    })
  }

  try {
    // Verify request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const requestData = await req.json().catch(err => {
      console.error('Failed to parse request body:', err)
      throw new Error('Invalid request format: ' + err.message)
    })
    
    const { conversion_id } = requestData
    console.log(`Processing notification request for conversion: ${conversion_id}`)

    if (!conversion_id) {
      throw new Error('Conversion ID is required')
    }

    // Get conversion and notification details
    const { data: notification, error: notificationError } = await supabase
      .from('conversion_notifications')
      .select('*, text_conversions(*)')
      .eq('conversion_id', conversion_id)
      .eq('status', 'pending')
      .maybeSingle()

    if (notificationError) {
      console.error('Database error when fetching notification:', notificationError)
      throw new Error(`Failed to fetch notification: ${notificationError.message}`)
    }

    if (!notification) {
      console.warn(`No pending notification found for conversion ID: ${conversion_id}`)
      return new Response(
        JSON.stringify({ 
          status: 'warning',
          message: 'No pending notification found for this conversion'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    console.log(`Sending email notification to: ${notification.email}`)

    // Send email notification with better error handling
    let emailResponse
    try {
      emailResponse = await resend.emails.send({
        from: 'Lovable <onboarding@resend.dev>',
        to: [notification.email],
        subject: 'Your Audio Conversion is Ready!',
        html: `
          <h1>Your Audio Conversion is Complete!</h1>
          <p>Your file "${notification.text_conversions.file_name || 'Conversion'}" has been successfully converted to audio.</p>
          <p>You can now download it from your conversions page.</p>
          <p>Best regards,<br>The Lovable Team</p>
        `,
      })
    } catch (emailError) {
      console.error('Resend API error:', emailError)
      throw new Error(`Failed to send email: ${emailError.message}`)
    }

    if (!emailResponse.id) {
      console.error('Email sending failed, no ID received:', emailResponse)
      throw new Error('Failed to send email: No confirmation ID received')
    }

    console.log(`Email sent successfully, ID: ${emailResponse.id}`)

    // Update notification status
    const { error: updateError } = await supabase
      .from('conversion_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', notification.id)

    if (updateError) {
      console.error('Failed to update notification status:', updateError)
      // Log the error but don't throw since email was sent successfully
      await supabase.from('system_logs').insert({
        event_type: 'notification',
        entity_id: notification.id,
        details: {
          operation: 'update_status',
          error: updateError.message,
          email_sent: true,
          email_id: emailResponse.id
        },
        status: 'warning'
      })
    }

    // Log successful notification
    await supabase.from('system_logs').insert({
      event_type: 'notification',
      entity_id: notification.id,
      details: {
        conversion_id: conversion_id,
        email: notification.email,
        email_id: emailResponse.id,
        file_name: notification.text_conversions.file_name
      },
      status: 'success'
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        email_id: emailResponse.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error sending notification:', error)
    
    // Log the error
    try {
      await supabase.from('system_logs').insert({
        event_type: 'notification',
        details: { 
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
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status || 500
      }
    )
  }
})
