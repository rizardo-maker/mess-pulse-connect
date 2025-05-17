
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Poll } from "@/types/poll";
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft, AlertCircle, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import DynamicPoll from '@/components/polls/DynamicPoll';

// Color palette for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const PollDetail = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pollData, setPollData] = useState<Poll | null>(null);

  useEffect(() => {
    if (!pollId) {
      navigate('/polls');
      return;
    }
    
    fetchPollData();
    fetchTotalStudents();
  }, [pollId]);
  
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
  
  const fetchPollData = async () => {
    if (!pollId) return;
    
    setLoading(true);
    try {
      // Fetch basic poll info (not votes, that's handled in DynamicPoll component)
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();
        
      if (error) throw error;
      setPollData(data as Poll);
    } catch (error) {
      console.error("Error fetching poll:", error);
      toast.error("Failed to load poll details");
      navigate('/polls');
    } finally {
      setLoading(false);
    }
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

  if (!pollId || !pollData) {
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
            <DynamicPoll pollId={pollId} />
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
                
                {!user && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md text-blue-700 mb-4">
                    <Info className="h-5 w-5 flex-shrink-0" />
                    <p>You need to log in to vote in this poll.</p>
                  </div>
                )}
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-rgukt-blue">
                    {pollData.allow_multiple_votes 
                      ? "You can select multiple options in this poll."
                      : "You can select only one option in this poll."}
                    {pollData.is_anonymous 
                      ? " Voting is anonymous."
                      : ""}
                  </p>
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
