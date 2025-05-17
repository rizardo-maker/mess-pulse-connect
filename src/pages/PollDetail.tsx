
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Poll, PollWithVotes } from "@/types/poll";
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, ArrowLeft, AlertCircle, Users, CheckCircle, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Color palette for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const PollDetail = () => {
  const { pollId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<PollWithVotes | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pollEnded, setPollEnded] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    if (!pollId) {
      navigate('/polls');
      return;
    }
    
    fetchPoll();
    fetchTotalStudents();
    
    // Set up realtime subscription
    const channel = supabase
      .channel(`poll-detail-${pollId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'poll_responses', filter: `poll_id=eq.${pollId}` }, 
        () => fetchPoll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId, user?.id]);
  
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
      
      responses?.forEach(response => {
        if (optionVotes[response.selected_option] !== undefined) {
          optionVotes[response.selected_option]++;
        }
      });
      
      // Check if current user has voted
      let hasVoted = false;
      let userVote = undefined;
      
      if (user) {
        const userResponse = responses?.find(r => r.user_id === user.id);
        if (userResponse) {
          hasVoted = true;
          userVote = userResponse.selected_option;
          setSelectedOption(userResponse.selected_option);
        }
      }
      
      setPoll({
        ...data,
        total_votes: responses?.length || 0,
        option_votes: optionVotes,
        has_voted: hasVoted,
        user_vote: userVote
      });
    } catch (error) {
      console.error("Error fetching poll:", error);
      toast.error("Failed to load poll details");
      navigate('/polls');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedOption || !poll || !user) {
      toast.error("Please select an option before voting");
      return;
    }
    
    if (poll.has_voted) {
      toast.error("You have already voted in this poll");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('poll_responses')
        .insert({
          poll_id: pollId,
          user_id: user.id,
          selected_option: selectedOption
        });
        
      if (error) throw error;
      
      toast.success("Your vote has been recorded successfully!");
      await fetchPoll(); // Refresh poll data
    } catch (error: any) {
      console.error("Error submitting vote:", error);
      
      if (error.code === '23505') {
        toast.error("You have already voted in this poll");
      } else {
        toast.error("Failed to submit vote");
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

  // Prepare chart data
  const getChartData = () => {
    if (!poll) return [];
    
    return Object.entries(poll.option_votes).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-rgukt-blue" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!poll) {
    return (
      <Layout>
        <div className="container py-8">
          <Card>
            <CardHeader>
              <CardTitle>Poll Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p>The poll you're looking for doesn't exist.</p>
            </CardContent>
            <CardFooter>
              <Link to="/polls">
                <Button>Back to Polls</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Poll Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue">{poll.title}</CardTitle>
                <CardDescription>{poll.description}</CardDescription>
                <p className="text-sm text-gray-500">
                  Poll {pollEnded ? 'ended' : 'ends'} on: {formatDate(poll.end_date)}
                </p>
                
                {pollEnded && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-amber-50 rounded-md text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">This poll has ended.</p>
                  </div>
                )}
                
                {poll.has_voted && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 rounded-md text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <p className="text-sm">You voted for: {poll.user_vote}</p>
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                {!pollEnded && !poll.has_voted && user ? (
                  /* Voting Form */
                  <div className="space-y-6">
                    <RadioGroup 
                      value={selectedOption || undefined} 
                      onValueChange={setSelectedOption}
                      className="space-y-4"
                    >
                      {poll.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    
                    <Button 
                      onClick={handleVote} 
                      disabled={isSubmitting || !selectedOption}
                      className="w-full bg-rgukt-blue hover:bg-rgukt-lightblue"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : "Submit Vote"}
                    </Button>
                  </div>
                ) : (
                  /* Results View */
                  <div className="space-y-6">
                    {!user && !pollEnded && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md text-blue-700 mb-4">
                        <Info className="h-5 w-5 flex-shrink-0" />
                        <p>You need to log in to vote in this poll.</p>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Results</h3>
                      
                      <div className="space-y-3">
                        {poll.options.map((option, index) => {
                          const votes = poll.option_votes[option] || 0;
                          const percentage = poll.total_votes > 0 
                            ? (votes / poll.total_votes) * 100
                            : 0;
                            
                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className={option === poll.user_vote ? "font-semibold" : ""}>
                                  {option} {option === poll.user_vote && "(Your vote)"}
                                </span>
                                <span>
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                              <Progress 
                                value={percentage} 
                                className="h-2" 
                                color={COLORS[index % COLORS.length]}
                              />
                              <div className="text-xs text-right text-gray-500">
                                {votes} {votes === 1 ? 'vote' : 'votes'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Pie Chart */}
                      <div className="h-64 mt-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getChartData()}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => 
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {getChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} votes`, 'Votes']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-4">
                        Total votes: {poll.total_votes}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue">About This Poll</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Your feedback helps us improve our services. Please participate in this poll to share your preferences.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-rgukt-blue">
                    Each user can vote only once per poll. Results are updated in real-time.
                  </p>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-md">
                  <p className="text-sm font-medium">Participation Rate</p>
                  <p className="text-xl font-bold text-amber-600">
                    {totalStudents > 0 && poll.total_votes
                      ? ((poll.total_votes / totalStudents) * 100).toFixed(1)
                      : 0}%
                  </p>
                  <Progress 
                    value={totalStudents > 0 && poll.total_votes
                      ? (poll.total_votes / totalStudents) * 100
                      : 0} 
                    className="h-2 mt-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PollDetail;
