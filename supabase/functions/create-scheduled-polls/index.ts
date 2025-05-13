
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
    // Get the Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Parse request body
    const { time } = await req.json()
    const currentHour = new Date(time).getHours()
    
    console.log(`Creating scheduled polls for hour: ${currentHour}`)
    
    // Get admin user ID for poll creation
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)

    if (adminError || !admins || admins.length === 0) {
      console.error('Failed to get admin user:', adminError)
      return new Response(
        JSON.stringify({ success: false, error: 'Admin user not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const adminId = admins[0].id
    const currentDate = new Date().toISOString().split('T')[0]
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 1) // Polls active for 1 day
    
    let pollsToCreate = []

    // Create different polls based on time of day
    if (currentHour === 7) {
      // Morning polls for breakfast
      pollsToCreate = [
        {
          title: `What's your feedback on today's breakfast (Engineering)?`,
          description: `Please rate your breakfast experience for ${currentDate} in the Engineering mess.`,
          options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
          end_date: endDate.toISOString().split('T')[0],
          created_by: adminId
        },
        {
          title: `What's your feedback on today's breakfast (PUC)?`,
          description: `Please rate your breakfast experience for ${currentDate} in the PUC mess.`,
          options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
          end_date: endDate.toISOString().split('T')[0],
          created_by: adminId
        }
      ]
    } else if (currentHour === 12) {
      // Noon polls for lunch
      pollsToCreate = [
        {
          title: `What's your feedback on today's lunch (Engineering)?`,
          description: `Please rate your lunch experience for ${currentDate} in the Engineering mess.`,
          options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
          end_date: endDate.toISOString().split('T')[0],
          created_by: adminId
        },
        {
          title: `What's your feedback on today's lunch (PUC)?`,
          description: `Please rate your lunch experience for ${currentDate} in the PUC mess.`,
          options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
          end_date: endDate.toISOString().split('T')[0],
          created_by: adminId
        }
      ]
    } else if (currentHour === 19) {
      // Evening polls for dinner
      pollsToCreate = [
        {
          title: `What's your feedback on today's dinner (Engineering)?`,
          description: `Please rate your dinner experience for ${currentDate} in the Engineering mess.`,
          options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
          end_date: endDate.toISOString().split('T')[0],
          created_by: adminId
        },
        {
          title: `What's your feedback on today's dinner (PUC)?`,
          description: `Please rate your dinner experience for ${currentDate} in the PUC mess.`,
          options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
          end_date: endDate.toISOString().split('T')[0],
          created_by: adminId
        }
      ]
    }

    if (pollsToCreate.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No polls scheduled for this hour' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the polls in the database
    const { data: pollsData, error: pollsError } = await supabase
      .from('polls')
      .insert(pollsToCreate)
      .select()

    if (pollsError) {
      console.error('Failed to create polls:', pollsError)
      return new Response(
        JSON.stringify({ success: false, error: pollsError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create notifications for the new polls
    const notifications = pollsToCreate.map((poll, index) => ({
      title: `New Feedback Poll: ${poll.title}`,
      content: `A new poll has been created for your feedback. Please share your experience!`,
      created_by: adminId,
      important: true,
      link: `/polls/${pollsData ? pollsData[index].id : ''}`
    }))

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (notifError) {
      console.error('Failed to create notifications:', notifError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Created ${pollsToCreate.length} polls for ${currentHour}:00`,
        data: pollsData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-scheduled-polls function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
