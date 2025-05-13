
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // First ensure that pg_cron and pg_net are installed
    await supabase.rpc('setup_extensions', {}, { count: 'exact' })
    
    // Clear existing cron jobs related to poll creation to avoid duplicates
    await supabase.rpc('clear_poll_cron_jobs', {}, { count: 'exact' })
    
    // Setup cron jobs for polls
    // 7:00 AM Breakfast polls
    await supabase.rpc('setup_cron_job', {
      job_name: 'create_breakfast_polls',
      schedule: '0 7 * * *', // 7:00 AM daily
      function_url: `${supabaseUrl}/functions/v1/create-scheduled-polls`,
      job_payload: JSON.stringify({ time: "07:00:00" })
    }, { count: 'exact' })
    
    // 12:00 PM Lunch polls
    await supabase.rpc('setup_cron_job', {
      job_name: 'create_lunch_polls',
      schedule: '0 12 * * *', // 12:00 PM daily
      function_url: `${supabaseUrl}/functions/v1/create-scheduled-polls`,
      job_payload: JSON.stringify({ time: "12:00:00" })
    }, { count: 'exact' })
    
    // 7:00 PM Dinner polls
    await supabase.rpc('setup_cron_job', {
      job_name: 'create_dinner_polls',
      schedule: '0 19 * * *', // 7:00 PM daily
      function_url: `${supabaseUrl}/functions/v1/create-scheduled-polls`,
      job_payload: JSON.stringify({ time: "19:00:00" })
    }, { count: 'exact' })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cron jobs for automatic polls setup successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error setting up cron jobs:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
