
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Poll, PollWithVotes } from "@/types/poll";
import Layout from '@/components/layout/Layout';
import PollCard from '@/components/polls/PollCard';
import PollStats from '@/components/stats/PollStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';

const Polls = () => {
  const { user } = useAuth();
  const [activePolls, setActivePolls] = useState<PollWithVotes[]>([]);
  const [pastPolls, setPastPolls] = useState<PollWithVotes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolls();
    
    // Set up realtime listeners for polls and responses
    const pollsChannel = supabase
      .channel('polls-page')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'polls' },
        () => fetchPolls()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'poll_responses' },
        () => fetchPolls()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pollsChannel);
    };
  }, [user]);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch all polls
      const { data: polls, error } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;

      // Process polls and add vote information
      const processedPolls = await Promise.all((polls || []).map(async (poll) => {
        // Get votes for this poll
        const { data: responses, error: votesError } = await supabase
          .from('poll_responses')
          .select('*')
          .eq('poll_id', poll.id);
          
        if (votesError) throw votesError;
        
        // Count votes per option
        const optionVotes: Record<string, number> = {};
        poll.options.forEach((option: string) => {
          optionVotes[option] = 0;
        });
        
        // Count unique voters
        const uniqueVoters = new Set();
        
        // Process responses
        responses?.forEach(response => {
          // Add voter to set
          uniqueVoters.add(response.user_id);
          
          // For backward compatibility
          if (typeof response.selected_option === 'string') {
            if (optionVotes[response.selected_option] !== undefined) {
              optionVotes[response.selected_option]++;
            }
          }
          
          // For new multiple selection format
          if (Array.isArray(response.selected_options)) {
            response.selected_options.forEach(option => {
              if (optionVotes[option] !== undefined) {
                optionVotes[option]++;
              }
            });
          }
        });
        
        // Check if current user has voted
        let hasVoted = false;
        let userVotes: string[] = [];
        
        if (user) {
          const userResponses = responses?.filter(r => r.user_id === user.id);
          if (userResponses && userResponses.length > 0) {
            hasVoted = true;
            
            // Collect user votes from both formats
            userResponses.forEach(response => {
              if (typeof response.selected_option === 'string') {
                userVotes.push(response.selected_option);
              }
              if (Array.isArray(response.selected_options)) {
                userVotes = [...userVotes, ...response.selected_options];
              }
            });
            
            // Remove duplicates
            userVotes = [...new Set(userVotes)];
          }
        }
        
        return {
          ...poll,
          total_votes: responses?.length || 0,
          option_votes: optionVotes,
          has_voted: hasVoted,
          user_votes: userVotes,
          voters_count: uniqueVoters.size
        } as PollWithVotes;
      }));

      // Separate active and past polls
      const active = processedPolls.filter(poll => poll.end_date >= today);
      const past = processedPolls.filter(poll => poll.end_date < today);
      
      setActivePolls(active);
      setPastPolls(past);
    } catch (error) {
      console.error("Error fetching polls:", error);
      toast.error("Failed to load polls");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-rgukt-blue mb-8">Polls & Feedback</h1>
        
        <PollStats />
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="active">Active Polls</TabsTrigger>
            <TabsTrigger value="past">Past Polls</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-rgukt-blue" />
              </div>
            ) : activePolls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activePolls.map(poll => (
                  <PollCard key={poll.id} poll={poll} isActive={true} />
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-rgukt-blue">No Active Polls</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>There are currently no active polls. Please check back later.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="past">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-rgukt-blue" />
              </div>
            ) : pastPolls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastPolls.map(poll => (
                  <PollCard key={poll.id} poll={poll} isActive={false} />
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-rgukt-blue">No Past Polls</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>There are no past polls in the system yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Polls;
