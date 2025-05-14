
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

// Enable realtime subscriptions for relevant tables
const enableRealtimeForTable = async (tableName: string) => {
  try {
    // Fix: Properly type the RPC call by using type assertion
    await supabase.rpc(
      'supabase_functions.extensions.enable_realtime' as string, 
      { relation: `public.${tableName}` } as Record<string, any>
    );
    console.log(`Realtime enabled for ${tableName}`);
  } catch (error) {
    // This is fine if it errors because the table is already added
    console.log(`Note: ${tableName} may already have realtime enabled`);
  }
};

// Initialize realtime for these tables if on client side
if (typeof window !== 'undefined') {
  Promise.all([
    enableRealtimeForTable('complaints'),
    enableRealtimeForTable('notifications'),
    enableRealtimeForTable('polls'),
    enableRealtimeForTable('poll_responses')
  ]).catch(error => {
    console.error('Error enabling realtime:', error);
  });
}

export const setupRealtimeListeners = () => {
  const complaintsChannel = supabase
    .channel('public:complaints')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, (payload) => {
      console.log('Complaints change received:', payload);
    })
    .subscribe();
    
  const notificationsChannel = supabase
    .channel('public:notifications')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
      console.log('Notifications change received:', payload);
    })
    .subscribe();
    
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
    supabase.removeChannel(complaintsChannel);
    supabase.removeChannel(notificationsChannel);
    supabase.removeChannel(pollsChannel);
    supabase.removeChannel(pollResponsesChannel);
  };
};
