
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://yleuwsgutjgncmpbndaw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsZXV3c2d1dGpnbmNtcGJuZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NjI0MDksImV4cCI6MjA2MjQzODQwOX0.4rSTAfCeLA6vMzhKtZnjV89dPVRGG2-gtrSFKQhaFBA";

// Create a singleton Supabase client
const globalWithSupabase = globalThis as typeof globalThis & {
  supabase: ReturnType<typeof createClient<Database>>
};

// Create the client with improved realtime configuration
export const supabase = globalWithSupabase.supabase || createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Store the client in the global scope to avoid multiple instances
if (typeof window !== 'undefined') {
  globalWithSupabase.supabase = supabase;
}

// Simplified approach to enable realtime - avoid using custom RPC calls
const setupPollsRealtime = async () => {
  console.log('Setting up realtime for polls and responses');
  
  // No need for RPC calls - channels will automatically work with proper permissions
  try {
    // Directly create channels for the tables
    const pollsChannel = supabase
      .channel('public:polls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, (payload) => {
        console.log('Polls change received:', payload);
      })
      .subscribe();
      
    const pollResponsesChannel = supabase
      .channel('public:poll_responses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_responses' }, (payload) => {
        console.log('Poll responses change received:', payload);
      })
      .subscribe();
      
    console.log('Realtime enabled for polls');
    console.log('Realtime enabled for poll_responses');
    
  } catch (error) {
    console.error('Error setting up realtime:', error);
  }
};

// Initialize realtime if on client side
if (typeof window !== 'undefined') {
  setupPollsRealtime().catch(error => {
    console.error('Error during realtime setup:', error);
  });
}

export const setupRealtimeListeners = () => {
  const pollsChannel = supabase
    .channel('public:polls')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, (payload) => {
      console.log('Polls change received:', payload);
    })
    .subscribe();
    
  const pollResponsesChannel = supabase
    .channel('public:poll_responses')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_responses' }, (payload) => {
      console.log('Poll responses change received:', payload);
    })
    .subscribe();
    
  return () => {
    supabase.removeChannel(pollsChannel);
    supabase.removeChannel(pollResponsesChannel);
  };
};
