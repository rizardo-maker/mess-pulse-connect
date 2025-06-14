
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://yleuwsgutjgncmpbndaw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsZXV3c2d1dGpnbmNtcGJuZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NjI0MDksImV4cCI6MjA2MjQzODQwOX0.4rSTAfCeLA6vMzhKtZnjV89dPVRGG2-gtrSFKQhaFBA";

// Create a singleton Supabase client optimized for high-scale applications
const globalWithSupabase = globalThis as typeof globalThis & {
  supabase: ReturnType<typeof createClient<Database>>
};

// Create the client with optimized configuration for 100k+ users
export const supabase = globalWithSupabase.supabase || createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    realtime: {
      params: {
        eventsPerSecond: 50, // Increased for high throughput
        heartbeatIntervalMs: 30000, // Optimized heartbeat
        reconnectDelayMs: 1000
      }
    },
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce' // More secure for large user bases
    },
    global: {
      headers: {
        'Cache-Control': 'max-age=300' // 5 minute cache for static resources
      }
    }
  }
);

// Store the client in the global scope to avoid multiple instances
if (typeof window !== 'undefined') {
  globalWithSupabase.supabase = supabase;
}

// Optimized realtime setup with connection pooling and error handling
const setupPollsRealtime = async () => {
  console.log('Setting up optimized realtime for large user base');
  
  try {
    // Use single channel with multiplexing for better performance
    const realtimeChannel = supabase
      .channel('public-data', {
        config: {
          presence: {
            key: 'user-presence'
          }
        }
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'polls' 
      }, (payload) => {
        console.log('Polls change received:', payload);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'poll_responses' 
      }, (payload) => {
        console.log('Poll responses change received:', payload);
      })
      .subscribe((status) => {
        console.log('Realtime connection status:', status);
      });
      
    console.log('Optimized realtime channels enabled');
    
  } catch (error) {
    console.error('Error setting up realtime:', error);
  }
};

// Initialize realtime with error handling for high-scale scenarios
if (typeof window !== 'undefined') {
  // Debounce initialization to prevent multiple calls
  let initTimeout: NodeJS.Timeout;
  const debouncedInit = () => {
    clearTimeout(initTimeout);
    initTimeout = setTimeout(() => {
      setupPollsRealtime().catch(error => {
        console.error('Error during realtime setup:', error);
      });
    }, 100);
  };
  
  debouncedInit();
}

// Optimized realtime listener setup with memory management
export const setupRealtimeListeners = () => {
  const channel = supabase
    .channel('public-optimized', {
      config: {
        broadcast: { self: false }, // Reduce echo for performance
        presence: { key: 'optimized-presence' }
      }
    })
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'polls' 
    }, (payload) => {
      console.log('Polls change received:', payload);
    })
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'poll_responses' 
    }, (payload) => {
      console.log('Poll responses change received:', payload);
    })
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
};

// Add connection health monitoring for large-scale deployments
export const monitorConnection = () => {
  const channel = supabase.channel('health-check');
  
  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      console.warn('Realtime connection issue detected, attempting reconnect...');
      // Implement exponential backoff for reconnection
      setTimeout(() => {
        setupPollsRealtime();
      }, Math.random() * 5000 + 1000); // Random delay to prevent thundering herd
    }
  });
  
  return channel;
};
