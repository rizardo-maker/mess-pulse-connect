
import React, { useState, useEffect } from 'react';
import { Poll, PollWithVotes } from '@/types/poll';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle, Loader2, Users, Vote } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface DynamicPollProps {
  pollId: string;
  onVoteComplete?: () => void;
}

const DynamicPoll = ({ pollId, onVoteComplete }: DynamicPollProps) => {
  const { user } = useAuth();
  const [poll, setPoll] = useState<PollWithVotes | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pollEnded, setPollEnded] = useState(false);

  useEffect(() => {
    fetchPoll();
    
    // Set up realtime subscription for this poll
    const channel = supabase
      .channel(`dynamic-poll-${pollId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'poll_responses', filter: `poll_id=eq.${pollId}` }, 
        () => fetchPoll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId, user?.id]);
  
  const fetchPoll = async () => {
    if (!pollId) return;
    
    setLoading(true);
    try {
      // Fetch the poll
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();
        
      if (error) throw error;
      
      // Check if poll has ended
      const today = new Date();
      const endDate = new Date(data.end_date);
      setPollEnded(endDate < today);
      
      // Get votes for this poll
      const { data: responses, error: votesError } = await supabase
        .from('poll_responses')
        .select('*')
        .eq('poll_id', pollId);
        
      if (votesError) throw votesError;
      
      // Count votes per option
      const optionVotes: Record<string, number> = {};
      data.options.forEach((option: string) => {
        optionVotes[option] = 0;
      });
      
      // Count unique voters
      const uniqueVoters = new Set();
      
      // Process all responses
      responses?.forEach(response => {
        // Add voter to set of unique voters
        uniqueVoters.add(response.user_id);
        
        // For backward compatibility with single option votes
        if (typeof response.selected_option === 'string') {
          if (optionVotes[response.selected_option] !== undefined) {
            optionVotes[response.selected_option]++;
          }
        }
        
        // For multiple option votes
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
          
          // Process user votes (backward compatibility + new format)
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
          
          // Set selected options for the form
          setSelectedOptions(userVotes);
        }
      }
      
      setPoll({
        ...data,
        total_votes: responses?.length || 0,
        option_votes: optionVotes,
        has_voted: hasVoted,
        user_votes: userVotes,
        voters_count: uniqueVoters.size
      });
    } catch (error) {
      console.error("Error fetching poll:", error);
      toast.error("Failed to load poll details");
    } finally {
      setLoading(false);
    }
  };

  const toggleOption = (option: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(option)) {
        return prev.filter(opt => opt !== option);
      } else {
        if (!poll?.allow_multiple_votes && prev.length > 0) {
          // If multiple votes aren't allowed, replace the selection
          return [option];
        }
        return [...prev, option];
      }
    });
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0 || !poll || !user) {
      toast.error("Please select at least one option before voting");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // If user has already voted, first delete their previous votes
      if (poll.has_voted) {
        const { error: deleteError } = await supabase
          .from('poll_responses')
          .delete()
          .eq('poll_id', pollId)
          .eq('user_id', user.id);
          
        if (deleteError) throw deleteError;
      }
      
      // Insert new vote with multiple options
      const { error } = await supabase
        .from('poll_responses')
        .insert({
          poll_id: pollId,
          user_id: user.id,
          selected_options: selectedOptions
        });
        
      if (error) throw error;
      
      toast.success("Your vote has been recorded successfully!");
      await fetchPoll();
      if (onVoteComplete) onVoteComplete();
    } catch (error: any) {
      console.error("Error submitting vote:", error);
      toast.error("Failed to submit vote");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-rgukt-blue" />
      </div>
    );
  }
  
  if (!poll) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-gray-500">Poll not found</p>
        </CardContent>
      </Card>
    );
  }
  
  const totalVotes = Object.values(poll.option_votes).reduce((sum, count) => sum + count, 0);
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-rgukt-blue text-xl flex items-center gap-2">
          <Vote className="h-5 w-5" /> {poll.title}
        </CardTitle>
        <CardDescription>
          {poll.description}
        </CardDescription>
        <div className="text-sm text-gray-500 mt-1 flex justify-between items-center">
          <span>
            {pollEnded ? 'Ended on' : 'Ends on'}: {formatDate(poll.end_date)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" /> {poll.voters_count} {poll.voters_count === 1 ? 'voter' : 'voters'}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {!pollEnded && (!poll.has_voted || poll.allow_multiple_votes) && user ? (
          <div className="space-y-3 mb-4">
            {poll.options.map((option, index) => (
              <div 
                key={index} 
                className={`flex items-center space-x-3 p-2 rounded-md 
                  ${selectedOptions.includes(option) 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50'
                  } transition-colors cursor-pointer`}
                onClick={() => toggleOption(option)}
              >
                <Checkbox 
                  id={`option-${index}`}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={() => toggleOption(option)}
                />
                <label 
                  htmlFor={`option-${index}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-grow"
                >
                  {option}
                </label>
              </div>
            ))}
            
            <Button 
              onClick={handleVote}
              disabled={isSubmitting || selectedOptions.length === 0}
              className="w-full mt-4 bg-rgukt-blue hover:bg-rgukt-lightblue"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : poll.has_voted ? "Update Vote" : "Submit Vote"}
            </Button>
          </div>
        ) : null}
        
        <div className="space-y-4">
          {poll.has_voted && (
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md text-green-700 mb-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">You voted for: {poll.user_votes?.join(', ')}</p>
            </div>
          )}
          
          <div className="space-y-3">
            {poll.options.map((option, index) => {
              const votes = poll.option_votes[option] || 0;
              const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
              const isSelected = poll.user_votes?.includes(option);
              
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={isSelected ? "font-semibold" : ""}>
                      {option} {isSelected && "(Your vote)"}
                    </span>
                    <span className="font-medium">
                      {votes} {votes === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={percentage} 
                      className={`h-6 ${
                        isSelected 
                          ? 'bg-blue-100' 
                          : 'bg-gray-100'
                      }`}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <p className="text-sm text-gray-500 mt-2 flex justify-between">
            <span>Total votes: {totalVotes}</span>
            {poll.is_anonymous && (
              <span className="italic">Anonymous voting enabled</span>
            )}
          </p>
        </div>
      </CardContent>
      
      {poll.has_voted && !pollEnded && (
        <CardFooter className="pt-0">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setSelectedOptions(poll.user_votes || [])}
          >
            Modify your vote
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default DynamicPoll;
