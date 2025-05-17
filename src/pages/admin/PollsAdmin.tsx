
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Poll, PollResponsesData } from "@/types/poll";
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Trash2, Eye, CheckSquare } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import AdminPollForm from '@/components/polls/AdminPollForm';
import DynamicPoll from '@/components/polls/DynamicPoll';

interface PollWithVoteCount extends Poll {
  votes: number;
}

const PollsAdmin = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<PollWithVoteCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingPollId, setDeletingPollId] = useState<string | null>(null);
  const [viewPollId, setViewPollId] = useState<string | null>(null);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [pollResponses, setPollResponses] = useState<PollResponsesData | null>(null);
  
  useEffect(() => {
    fetchPolls();
    
    // Set up realtime subscription for polls and responses
    const channel = supabase
      .channel('admin-polls-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'polls' }, 
        () => fetchPolls()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'poll_responses' }, 
        () => {
          if (viewPollId) {
            fetchPollResponses(viewPollId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // For each poll, fetch the vote count
      const pollsWithVotes = await Promise.all(
        (data || []).map(async (poll) => {
          const { count, error: countError } = await supabase
            .from('poll_responses')
            .select('*', { count: 'exact', head: true })
            .eq('poll_id', poll.id);
            
          if (countError) throw countError;
          
          return {
            ...poll,
            votes: count || 0
          };
        })
      );
      
      setPolls(pollsWithVotes);
    } catch (error) {
      console.error("Error fetching polls:", error);
      toast.error("Failed to load polls");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPollResponses = async (pollId: string) => {
    setLoadingResponses(true);
    try {
      // Get the poll data
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();
        
      if (pollError) throw pollError;
      
      // Get responses for this poll with a simpler query that won't cause type errors
      const { data: responseData, error: responsesError } = await supabase
        .from('poll_responses')
        .select('*')
        .eq('poll_id', pollId);
        
      if (responsesError) throw responsesError;
      
      // Query usernames separately to avoid the relation error
      const userIds = responseData?.map(response => response.user_id) || [];
      const { data: usernameData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      // Create a lookup map for usernames
      const usernameMap: Record<string, string> = {};
      usernameData?.forEach(profile => {
        usernameMap[profile.id] = profile.username || 'Anonymous';
      });
      
      // Attach usernames to responses
      const responses = responseData?.map(response => ({
        ...response,
        profiles: { username: usernameMap[response.user_id] || response.user_id }
      })) || [];
      
      // Calculate results by option
      const results: Record<string, number> = {};
      if (poll && poll.options) {
        poll.options.forEach((option: string) => {
          results[option] = 0;
        });
        
        responses.forEach(response => {
          // Handle both old format (single option) and new format (multiple options)
          if (typeof response.selected_option === 'string' && results[response.selected_option] !== undefined) {
            results[response.selected_option]++;
          }
          
          if (Array.isArray(response.selected_options)) {
            response.selected_options.forEach(option => {
              if (results[option] !== undefined) {
                results[option]++;
              }
            });
          }
        });
      }
      
      // Count unique voters
      const uniqueVoters = new Set(responses.map(r => r.user_id));
      
      setPollResponses({
        poll,
        responses,
        results,
        totalVotes: Object.values(results).reduce((sum, count) => sum + count, 0),
        votersCount: uniqueVoters.size
      });
    } catch (error) {
      console.error("Error fetching poll responses:", error);
      toast.error("Failed to load poll responses");
    } finally {
      setLoadingResponses(false);
    }
  };
  
  const handleDeletePoll = async (pollId: string) => {
    setDeletingPollId(pollId);
    
    try {
      // First delete all responses to this poll
      await supabase
        .from('poll_responses')
        .delete()
        .eq('poll_id', pollId);
        
      // Then delete the poll itself
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId);
        
      if (error) throw error;
      
      toast.success("Poll deleted successfully");
      setConfirmDeleteId(null);
      await fetchPolls();
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast.error("Failed to delete poll");
    } finally {
      setDeletingPollId(null);
    }
  };
  
  const handleViewPoll = (pollId: string) => {
    setViewPollId(pollId);
    fetchPollResponses(pollId);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Check if poll has ended
  const isPollActive = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    return end >= today;
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-rgukt-blue mb-6">Manage Polls</h1>
        
        <div className="mb-6">
          <Link to="/admin">
            <Button variant="outline" className="text-rgukt-blue border-rgukt-blue">
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Poll Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue">Create New Poll</CardTitle>
                <CardDescription>
                  Create a new poll to gather feedback from users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminPollForm onSuccess={fetchPolls} />
              </CardContent>
            </Card>
          </div>
          
          {/* Polls List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue">All Polls</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-rgukt-blue" />
                  </div>
                ) : polls.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {polls.map(poll => (
                        <TableRow key={poll.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {poll.title}
                              {poll.allow_multiple_votes && (
                                <CheckSquare className="h-4 w-4 text-green-500" title="Multiple options allowed" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isPollActive(poll.end_date) 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {isPollActive(poll.end_date) ? 'Active' : 'Ended'}
                            </span>
                          </TableCell>
                          <TableCell>{poll.votes}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewPoll(poll.id)}
                                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setConfirmDeleteId(poll.id)}
                                disabled={deletingPollId === poll.id}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                {deletingPollId === poll.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-4 text-gray-500">No polls created yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* View Poll Dialog */}
      {viewPollId && (
        <Dialog open={!!viewPollId} onOpenChange={(open) => !open && setViewPollId(null)}>
          <DialogContent className="max-w-4xl">
            {loadingResponses ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-rgukt-blue" />
              </div>
            ) : pollResponses?.poll ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-rgukt-blue">
                    {pollResponses.poll.title}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Created on {formatDate(pollResponses.poll.created_at)} • 
                    Ends on {formatDate(pollResponses.poll.end_date)}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-4">
                  <DynamicPoll pollId={viewPollId} />
                </div>
                
                <DialogFooter className="mt-4">
                  <Button 
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      setConfirmDeleteId(viewPollId);
                      setViewPollId(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Poll
                  </Button>
                  <Button onClick={() => setViewPollId(null)}>Close</Button>
                </DialogFooter>
              </>
            ) : (
              <div>
                <DialogHeader>
                  <DialogTitle>Error</DialogTitle>
                </DialogHeader>
                <p className="py-4">Failed to load poll details</p>
                <DialogFooter>
                  <Button onClick={() => setViewPollId(null)}>Close</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this poll and all associated votes. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmDeleteId && handleDeletePoll(confirmDeleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default PollsAdmin;
