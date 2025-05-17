
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Poll } from "@/types/poll";
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Loader2, Trash2, Eye, Plus, X } from "lucide-react";
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

const PollsAdmin = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingPollId, setDeletingPollId] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState(['', '']); // Start with two empty options
  const [viewPollId, setViewPollId] = useState<string | null>(null);
  const [pollResponses, setPollResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      endDate: ''
    }
  });

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
      
      // Get responses for this poll
      const { data: responses, error: responsesError } = await supabase
        .from('poll_responses')
        .select('*, profiles:user_id(username)')
        .eq('poll_id', pollId);
        
      if (responsesError) throw responsesError;
      
      // Calculate results by option
      const results = {};
      if (poll && poll.options) {
        poll.options.forEach(option => {
          results[option] = 0;
        });
        
        responses?.forEach(response => {
          if (results[response.selected_option] !== undefined) {
            results[response.selected_option]++;
          }
        });
      }
      
      setPollResponses({
        poll,
        responses: responses || [],
        results,
        totalVotes: responses?.length || 0
      });
    } catch (error) {
      console.error("Error fetching poll responses:", error);
      toast.error("Failed to load poll responses");
    } finally {
      setLoadingResponses(false);
    }
  };
  
  const addOption = () => {
    setPollOptions([...pollOptions, '']);
  };
  
  const removeOption = (index: number) => {
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };
  
  const onCreatePoll = async (data) => {
    // Validate options
    const validOptions = pollOptions.filter(option => option.trim() !== '');
    
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options for the poll");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('polls')
        .insert({
          title: data.title,
          description: data.description,
          end_date: data.endDate,
          options: validOptions,
          created_by: user?.id
        });
      
      if (error) throw error;
      
      toast.success("Poll created successfully");
      reset();
      setPollOptions(['', '']);
      await fetchPolls();
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll");
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
                <form onSubmit={handleSubmit(onCreatePoll)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Poll Title</Label>
                    <Input 
                      id="title"
                      placeholder="Enter poll title"
                      {...register("title", { required: "Title is required" })}
                      className={errors.title ? "border-red-500" : ""}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm">{errors.title.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description"
                      placeholder="Enter poll description"
                      {...register("description", { required: "Description is required" })}
                      className={errors.description ? "border-red-500" : ""}
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm">{errors.description.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input 
                      id="endDate"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      {...register("endDate", { required: "End date is required" })}
                      className={errors.endDate ? "border-red-500" : ""}
                    />
                    {errors.endDate && (
                      <p className="text-red-500 text-sm">{errors.endDate.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Poll Options</Label>
                    <p className="text-sm text-gray-500 mb-2">Add at least 2 options for your poll</p>
                    
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex space-x-2 mb-2">
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1"
                        />
                        {index > 1 && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => removeOption(index)}
                            className="text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addOption}
                      className="mt-2 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-rgukt-blue hover:bg-rgukt-lightblue"
                  >
                    Create Poll
                  </Button>
                </form>
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
                          <TableCell className="font-medium">{poll.title}</TableCell>
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
                
                <div className="space-y-6 my-4">
                  <div>
                    <h3 className="text-lg font-medium">Description:</h3>
                    <p className="mt-1 text-gray-600">{pollResponses.poll.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Results */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Poll Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {pollResponses.poll.options.map((option, index) => {
                            const votes = pollResponses.results[option] || 0;
                            const percentage = pollResponses.totalVotes > 0 
                              ? (votes / pollResponses.totalVotes) * 100 
                              : 0;
                            
                            return (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{option}</span>
                                  <span>{votes} votes ({percentage.toFixed(1)}%)</span>
                                </div>
                                <Progress 
                                  value={percentage}
                                  className="h-2.5" 
                                />
                              </div>
                            );
                          })}
                        </div>
                        
                        <p className="text-sm font-medium mt-4">
                          Total votes: {pollResponses.totalVotes}
                        </p>
                      </CardContent>
                    </Card>
                    
                    {/* Responses */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                          Responses ({pollResponses.responses.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-[300px] overflow-y-auto">
                          {pollResponses.responses.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>User</TableHead>
                                  <TableHead>Selected Option</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pollResponses.responses.map(response => (
                                  <TableRow key={response.id}>
                                    <TableCell>
                                      {response.profiles?.username || response.user_id}
                                    </TableCell>
                                    <TableCell>{response.selected_option}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <p className="text-center py-4 text-gray-500">No responses yet</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <DialogFooter>
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
