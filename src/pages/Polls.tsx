
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, UserRound, CheckCircle, CircleAlert, ArrowRight } from 'lucide-react';

const Polls = () => {
  const { user } = useAuth();
  const [activePolls, setActivePolls] = useState<any[]>([]);
  const [pastPolls, setPastPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [participationRate, setParticipationRate] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);

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
        () => {
          fetchPollVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pollsChannel);
      supabase.removeChannel(responsesChannel);
    };
  }, []);
  
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
  
  const fetchPollVotes = async () => {
    try {
      const { count } = await supabase
        .from('poll_responses')
        .select('*', { count: 'exact', head: true });
      
      setTotalVotes(count || 0);
      
      if (totalStudents > 0) {
        // Calculate average participation rate across all polls
        setParticipationRate((count || 0) / totalStudents * 100);
      }
    } catch (error) {
      console.error('Error fetching poll votes:', error);
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
      
      // For each poll, fetch the vote count
      const activeWithCounts = await Promise.all(
        (active || []).map(async (poll) => {
          const { count } = await supabase
            .from('poll_responses')
            .select('*', { count: 'exact', head: true })
            .eq('poll_id', poll.id);
          
          return {
            ...poll,
            voteCount: count || 0
          };
        })
      );
      
      const pastWithCounts = await Promise.all(
        (past || []).map(async (poll) => {
          const { count } = await supabase
            .from('poll_responses')
            .select('*', { count: 'exact', head: true })
            .eq('poll_id', poll.id);
          
          return {
            ...poll,
            voteCount: count || 0
          };
        })
      );
      
      setActivePolls(activeWithCounts);
      setPastPolls(pastWithCounts);
      fetchPollVotes();
    } catch (error) {
      console.error("Error fetching polls:", error);
      toast.error("Failed to load polls");
    } finally {
      setLoading(false);
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
            ) : activePolls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activePolls.map(poll => (
                  <Card key={poll.id} className="overflow-hidden hover:shadow-lg transition-all">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-rgukt-blue text-xl">{poll.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {poll.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pb-3">
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                        <span>Ends: {formatDate(poll.end_date)}</span>
                        <span>{poll.voteCount} votes</span>
                      </div>
                      
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div 
                          className="bg-rgukt-blue h-1.5 rounded-full" 
                          style={{ 
                            width: `${Math.min((poll.voteCount / totalStudents) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </CardContent>
                    
                    <div className="p-4 pt-0 mt-2">
                      <Link to={`/polls/${poll.id}`}>
                        <Button 
                          className="w-full flex items-center justify-center gap-2 bg-rgukt-blue hover:bg-rgukt-lightblue"
                        >
                          <span>Participate</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
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
                  <Card key={poll.id} className="overflow-hidden hover:shadow transition-all">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-rgukt-blue text-xl">{poll.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {poll.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pb-3">
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                        <span>Ended: {formatDate(poll.end_date)}</span>
                        <span>{poll.voteCount} votes</span>
                      </div>
                    </CardContent>
                    
                    <div className="p-4 pt-0 mt-2">
                      <Link to={`/polls/${poll.id}`}>
                        <Button 
                          className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700"
                        >
                          <span>View Results</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
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
