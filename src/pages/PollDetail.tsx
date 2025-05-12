
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const PollDetail = () => {
  const { pollId } = useParams();
  const { user } = useAuth();
  const [poll, setPoll] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pollResults, setPollResults] = useState<any>({});
  const [totalStudents, setTotalStudents] = useState(0);
  const [pollEnded, setPollEnded] = useState(false);

  useEffect(() => {
    if (!pollId) return;
    
    fetchPoll();
    fetchTotalStudents();
    
    // Set up real-time subscription for polls and responses
    const pollsChannel = supabase
      .channel('poll-detail-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'polls', filter: `id=eq.${pollId}` },
        () => {
          fetchPoll();
        }
      )
      .subscribe();
      
    const responsesChannel = supabase
      .channel('poll-responses-detail-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_responses', filter: `poll_id=eq.${pollId}` },
        () => {
          if (hasVoted || pollEnded) {
            fetchPollResults();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pollsChannel);
      supabase.removeChannel(responsesChannel);
    };
  }, [pollId, user?.id, hasVoted, pollEnded]);
  
  const fetchTotalStudents = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'visitor');
        
      if (error) throw error;
      
      setTotalStudents(count || 0);
    } catch (error) {
      console.error('Error fetching student count:', error);
    }
  };
  
  const fetchPoll = async () => {
    setLoading(true);
    try {
      if (!pollId) {
        toast.error("Poll ID is missing");
        return;
      }
      
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();
        
      if (error) throw error;
      
      setPoll(data);
      
      // Check if poll has ended
      const today = new Date();
      const endDate = new Date(data.end_date);
      setPollEnded(endDate < today);
      
      if (user) {
        await checkUserVote();
      } else {
        setHasVoted(false);
        setSelectedOption(null);
      }
      
      // Only fetch results if the user has voted or the poll has ended
      if (user && (hasVoted || endDate < today)) {
        await fetchPollResults();
      }
    } catch (error) {
      console.error("Error fetching poll:", error);
      toast.error("Failed to load poll");
    } finally {
      setLoading(false);
    }
  };
  
  const checkUserVote = async () => {
    if (!user || !pollId) return;
    
    try {
      const { data, error } = await supabase
        .from('poll_responses')
        .select('selected_option')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setHasVoted(true);
        setSelectedOption(data.selected_option);
      } else {
        setHasVoted(false);
        setSelectedOption(null);
      }
    } catch (error) {
      console.error("Error checking user vote:", error);
    }
  };
  
  const fetchPollResults = async () => {
    if (!pollId) return;
    
    try {
      // Get responses for this poll
      const { data: responses, error: responsesError, count } = await supabase
        .from('poll_responses')
        .select('*', { count: 'exact' })
        .eq('poll_id', pollId);
        
      if (responsesError) throw responsesError;
      
      // Calculate results for each option
      const optionCounts: Record<string, number> = {};
      const results: Record<string, number> = {};
      
      // Initialize counts to 0
      if (poll?.options) {
        poll.options.forEach((option: string) => {
          optionCounts[option] = 0;
        });
      }
      
      // Count responses
      if (responses) {
        responses.forEach((response) => {
          const option = response.selected_option;
          optionCounts[option] = (optionCounts[option] || 0) + 1;
        });
      }
      
      // Calculate percentages
      const totalVotes = count || 0;
      if (totalVotes > 0) {
        Object.keys(optionCounts).forEach(option => {
          results[option] = (optionCounts[option] / totalVotes) * 100;
        });
      }
      
      setPollResults({
        totalVotes,
        optionCounts,
        percentages: results,
        chartData: Object.keys(optionCounts).map(option => ({
          name: option,
          value: optionCounts[option]
        }))
      });
      
    } catch (error) {
      console.error("Error fetching poll results:", error);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedOption || !poll || !user) {
      toast.error("Please select an option before voting");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if user already voted
      const { data: existingVote, error: checkError } = await supabase
        .from('poll_responses')
        .select('*')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingVote) {
        toast.error("You have already voted in this poll");
        setHasVoted(true);
        return;
      }
      
      const { error } = await supabase
        .from('poll_responses')
        .insert({
          poll_id: pollId,
          user_id: user.id,
          selected_option: selectedOption
        });
        
      if (error) throw error;
      
      toast.success("Your vote has been recorded successfully!");
      setHasVoted(true);
      await fetchPollResults();
    } catch (error: any) {
      console.error("Error submitting vote:", error);
      
      if (error.code === '23505') {
        toast.error("You have already voted in this poll");
        await checkUserVote();
      } else {
        toast.error("Failed to submit vote. Please try again.");
      }
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
  
  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6">
          <Link to="/polls">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Polls
            </Button>
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-rgukt-blue" />
          </div>
        ) : !poll ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-rgukt-blue">Poll Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p>The poll you are looking for doesn't exist or has been removed.</p>
            </CardContent>
            <CardFooter>
              <Link to="/polls">
                <Button>Return to Polls</Button>
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-rgukt-blue">{poll.title}</CardTitle>
                  <CardDescription>
                    {poll.description}
                  </CardDescription>
                  <p className="text-sm text-gray-500">
                    Poll {pollEnded ? 'ended' : 'ends'} on: {formatDate(poll.end_date)}
                  </p>
                  {pollEnded && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-amber-50 rounded-md text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">This poll has ended.</p>
                    </div>
                  )}
                </CardHeader>
                
                <CardContent>
                  {!hasVoted && !pollEnded ? (
                    <RadioGroup 
                      value={selectedOption || undefined} 
                      onValueChange={setSelectedOption}
                      className="space-y-4"
                    >
                      {poll.options.map((option: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-4">
                      {(hasVoted || pollEnded) && <p className="font-medium text-green-600">
                        {hasVoted ? "Thank you for voting!" : "Poll results:"}
                      </p>}
                      <div className="space-y-3">
                        {poll.options.map((option: string, index: number) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className={option === selectedOption ? "font-semibold" : ""}>
                                {option} {option === selectedOption && "(Your vote)"}
                              </span>
                              <span>
                                {pollResults.percentages && pollResults.percentages[option] !== undefined 
                                  ? pollResults.percentages[option].toFixed(1) 
                                  : 0}%
                              </span>
                            </div>
                            <Progress 
                              value={pollResults.percentages && pollResults.percentages[option] !== undefined
                                ? pollResults.percentages[option]
                                : 0} 
                              className={option === selectedOption ? "h-2 bg-blue-100" : "h-2"} 
                            />
                            <div className="text-xs text-right text-gray-500">
                              {pollResults.optionCounts && pollResults.optionCounts[option] !== undefined
                                ? pollResults.optionCounts[option]
                                : 0} votes
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {(hasVoted || pollEnded) && (
                        <div className="pt-6 pb-2">
                          <ChartContainer className="h-60" config={{}}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <ChartTooltip 
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      return (
                                        <ChartTooltipContent>
                                          <div className="space-y-1">
                                            <p className="font-medium">{payload[0].name}</p>
                                            <p className="text-sm text-muted-foreground">
                                              Votes: {payload[0].value}
                                            </p>
                                          </div>
                                        </ChartTooltipContent>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Pie
                                  data={pollResults.chartData || []}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  nameKey="name"
                                  label={({ name, percent }) => 
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                  }
                                >
                                  {(pollResults.chartData || []).map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-500 mt-4">
                        Total votes: {pollResults.totalVotes || 0}
                      </p>
                    </div>
                  )}
                </CardContent>
                
                {!hasVoted && !pollEnded && (
                  <CardFooter>
                    <Button 
                      onClick={handleSubmitVote} 
                      disabled={isSubmitting || !selectedOption || !user}
                      className="w-full bg-rgukt-blue hover:bg-rgukt-lightblue"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Vote"}
                    </Button>
                    {!user && (
                      <p className="text-sm text-red-500 mt-2">
                        You must be logged in to vote
                      </p>
                    )}
                  </CardFooter>
                )}
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-rgukt-blue">About This Poll</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Your feedback helps us improve the mess services. Please participate in this poll to share your preferences.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-sm text-rgukt-blue">
                      Each student can vote only once per poll. Results are updated in real-time.
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-md">
                    <p className="text-sm font-medium">Participation Rate</p>
                    <p className="text-xl font-bold text-amber-600">
                      {totalStudents > 0 && pollResults.totalVotes
                        ? ((pollResults.totalVotes / totalStudents) * 100).toFixed(1)
                        : 0}%
                    </p>
                    <Progress 
                      value={totalStudents > 0 && pollResults.totalVotes
                        ? (pollResults.totalVotes / totalStudents) * 100
                        : 0} 
                      className="h-2 mt-2" 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PollDetail;
