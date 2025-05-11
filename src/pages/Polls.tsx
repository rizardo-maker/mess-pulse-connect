
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, UserRound, CheckCircle, CircleAlert } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const Polls = () => {
  const { user } = useAuth();
  // Active poll state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [activePolls, setActivePolls] = useState<any[]>([]);
  const [pastPolls, setPastPolls] = useState<any[]>([]);
  const [currentActivePoll, setCurrentActivePoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [pollResults, setPollResults] = useState<any>({});
  const [totalStudents, setTotalStudents] = useState(0);
  const [participationRate, setParticipationRate] = useState(0);

  useEffect(() => {
    fetchPolls();
    fetchTotalStudents();
    
    // Set up real-time subscription for polls and responses
    const pollsChannel = supabase
      .channel('public-polls-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'polls' },
        () => {
          fetchPolls();
        }
      )
      .subscribe();
      
    const responsesChannel = supabase
      .channel('public-responses-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_responses' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            fetchPollResults(currentActivePoll?.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pollsChannel);
      supabase.removeChannel(responsesChannel);
    };
  }, [currentActivePoll]);
  
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
  
  const fetchPolls = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch active polls where end_date is greater than or equal to today
      const { data: active, error: activeError } = await supabase
        .from('polls')
        .select('*')
        .gte('end_date', today)
        .order('created_at', { ascending: false });
        
      if (activeError) throw activeError;
      
      // Fetch past polls where end_date is less than today
      const { data: past, error: pastError } = await supabase
        .from('polls')
        .select('*')
        .lt('end_date', today)
        .order('end_date', { ascending: false });
        
      if (pastError) throw pastError;
      
      setActivePolls(active || []);
      setPastPolls(past || []);
      
      // Set current active poll to first one if available
      if (active && active.length > 0) {
        setCurrentActivePoll(active[0]);
        checkUserVote(active[0].id);
        fetchPollResults(active[0].id);
      } else {
        setCurrentActivePoll(null);
      }
    } catch (error) {
      console.error("Error fetching polls:", error);
      toast.error("Failed to load polls");
    } finally {
      setLoading(false);
    }
  };
  
  const checkUserVote = async (pollId: string) => {
    if (!user) return;
    
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
  
  const fetchPollResults = async (pollId: string) => {
    if (!pollId) return;
    
    setLoadingResults(true);
    
    try {
      // Get the poll details first to get the options
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();
        
      if (pollError) throw pollError;
      
      // Get responses for this poll
      const { data: responses, error: responsesError, count } = await supabase
        .from('poll_responses')
        .select('*', { count: 'exact' })
        .eq('poll_id', pollId);
        
      if (responsesError) throw responsesError;
      
      // Calculate results for each option
      const results: Record<string, number> = {};
      const optionCounts: Record<string, number> = {};
      
      // Initialize counts to 0
      if (poll.options) {
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
        pollId,
        totalVotes,
        optionCounts,
        percentages: results,
        chartData: Object.keys(optionCounts).map(option => ({
          name: option,
          value: optionCounts[option]
        }))
      });
      
      // Calculate participation rate
      if (totalStudents > 0) {
        setParticipationRate((totalVotes / totalStudents) * 100);
      }
      
    } catch (error) {
      console.error("Error fetching poll results:", error);
      toast.error("Failed to load poll results");
    } finally {
      setLoadingResults(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedOption || !currentActivePoll || !user) {
      toast.error("Please select an option before voting");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('poll_responses')
        .insert({
          poll_id: currentActivePoll.id,
          user_id: user.id,
          selected_option: selectedOption
        });
        
      if (error) throw error;
      
      toast.success("Your vote has been recorded successfully!");
      setHasVoted(true);
      fetchPollResults(currentActivePoll.id);
    } catch (error: any) {
      console.error("Error submitting vote:", error);
      
      if (error.code === '23505') {
        toast.error("You have already voted in this poll");
        checkUserVote(currentActivePoll.id);
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
        <h1 className="text-3xl font-bold text-rgukt-blue mb-8">Polls & Feedback</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-600">Total Students</h3>
                  <p className="text-3xl font-bold text-rgukt-blue">{totalStudents}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <UserRound className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-600">Active Polls</h3>
                  <p className="text-3xl font-bold text-green-600">{activePolls.length}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-600">Participation Rate</h3>
                  <p className="text-3xl font-bold text-amber-600">
                    {participationRate.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-amber-100 p-3 rounded-full">
                  <CircleAlert className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="active">Active Polls</TabsTrigger>
            <TabsTrigger value="past">Past Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-rgukt-blue" />
              </div>
            ) : currentActivePoll ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-rgukt-blue">{currentActivePoll.title}</CardTitle>
                      <CardDescription>
                        {currentActivePoll.description}
                      </CardDescription>
                      <p className="text-sm text-gray-500">
                        Poll ends on: {formatDate(currentActivePoll.end_date)}
                      </p>
                    </CardHeader>
                    
                    <CardContent>
                      {!hasVoted ? (
                        <RadioGroup 
                          value={selectedOption || undefined} 
                          onValueChange={setSelectedOption}
                          className="space-y-4"
                        >
                          {currentActivePoll.options.map((option: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`option-${index}`} />
                              <Label htmlFor={`option-${index}`} className="cursor-pointer">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : loadingResults ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-rgukt-blue" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="font-medium text-green-600">Thank you for voting!</p>
                          <div className="space-y-3">
                            {currentActivePoll.options.map((option: string, index: number) => (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{option}</span>
                                  <span>
                                    {pollResults.percentages && pollResults.percentages[option] 
                                      ? pollResults.percentages[option].toFixed(1) 
                                      : 0}%
                                  </span>
                                </div>
                                <Progress 
                                  value={pollResults.percentages && pollResults.percentages[option] 
                                    ? pollResults.percentages[option]
                                    : 0} 
                                  className="h-2" 
                                />
                              </div>
                            ))}
                          </div>
                          
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
                          
                          <p className="text-sm text-gray-500 mt-4">
                            Total votes: {pollResults.totalVotes || 0}
                          </p>
                        </div>
                      )}
                    </CardContent>
                    
                    {!hasVoted && (
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
                      <CardTitle className="text-rgukt-blue">About Polls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Your feedback helps us improve the mess services. Polls are conducted regularly to gather student preferences.
                      </p>
                      
                      <div className="bg-blue-50 p-4 rounded-md">
                        <p className="text-sm text-rgukt-blue">
                          Each student can vote only once per poll. Results are published after the polling period ends.
                        </p>
                      </div>
                      
                      <Separator />
                      
                      {activePolls.length > 1 && (
                        <div>
                          <h3 className="font-medium mb-2">Other Active Polls</h3>
                          <div className="space-y-2">
                            {activePolls.slice(0, 3).map((poll, index) => (
                              poll.id !== currentActivePoll.id && (
                                <Button
                                  key={poll.id}
                                  variant="outline"
                                  className="w-full justify-start text-left"
                                  onClick={() => {
                                    setCurrentActivePoll(poll);
                                    checkUserVote(poll.id);
                                    fetchPollResults(poll.id);
                                  }}
                                >
                                  <span className="truncate">{poll.title}</span>
                                </Button>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
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
              <div className="space-y-8">
                {pastPolls.map(poll => (
                  <Card key={poll.id}>
                    <CardHeader>
                      <CardTitle className="text-rgukt-blue">{poll.title}</CardTitle>
                      <CardDescription>
                        {poll.description}
                      </CardDescription>
                      <p className="text-sm text-gray-500">
                        Poll ended on: {formatDate(poll.end_date)}
                      </p>
                    </CardHeader>
                    
                    <CardContent>
                      <Button
                        variant="outline" 
                        onClick={() => fetchPollResults(poll.id)}
                        className="mb-4"
                      >
                        {loadingResults && pollResults.pollId === poll.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        View Results
                      </Button>
                      
                      {pollResults.pollId === poll.id && (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            {poll.options.map((option: string, index: number) => (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{option}</span>
                                  <span>
                                    {pollResults.percentages[option] 
                                      ? pollResults.percentages[option].toFixed(1) 
                                      : 0}%
                                  </span>
                                </div>
                                <Progress 
                                  value={pollResults.percentages[option] || 0} 
                                  className="h-2" 
                                />
                              </div>
                            ))}
                          </div>
                          
                          <p className="text-sm text-gray-500 mt-2">
                            Total votes: {pollResults.totalVotes || 0}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
