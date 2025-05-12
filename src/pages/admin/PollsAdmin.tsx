
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from 'react-router-dom';
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Trash2, Eye, BarChart } from "lucide-react";
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

const PollsAdmin = () => {
  const { user } = useAuth();
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [activePolls, setActivePolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingPollId, setDeletingPollId] = useState<string | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedPoll, setSelectedPoll] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [pollResponses, setPollResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  
  const pollForm = useForm({
    defaultValues: {
      title: '',
      description: '',
      endDate: ''
    }
  });

  useEffect(() => {
    fetchActivePolls();
    fetchTotalStudents();
    
    // Set up real-time subscription for polls
    const pollsChannel = supabase
      .channel('polls-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'polls' },
        () => {
          fetchActivePolls();
        }
      )
      .subscribe();
      
    // Set up real-time subscription for poll responses
    const responsesChannel = supabase
      .channel('poll-responses-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_responses' },
        () => {
          if (selectedPoll) {
            fetchPollResponses(selectedPoll.id);
          }
          fetchActivePolls();
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
  
  const fetchActivePolls = async () => {
    setLoading(true);
    try {
      // Fetch active polls
      const { data: polls, error } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // For each poll, fetch the vote count
      const pollsWithVoteCounts = await Promise.all(
        polls.map(async (poll) => {
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
      
      setActivePolls(pollsWithVoteCounts);
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
      const { data, error } = await supabase
        .from('poll_responses')
        .select('*, profiles:user_id(username)')
        .eq('poll_id', pollId);
        
      if (error) throw error;
      
      setPollResponses(data || []);
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
  
  const handleCreatePoll = async (formData: any) => {
    // Filter out empty options
    const validOptions = pollOptions.filter(option => option.trim() !== '');
    
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options for the poll");
      return;
    }
    
    setIsCreatingPoll(true);
    
    try {
      const { data, error } = await supabase
        .from('polls')
        .insert({
          title: formData.title,
          description: formData.description,
          end_date: formData.endDate,
          options: validOptions,
          created_by: user?.id
        })
        .select();
      
      if (error) throw error;
      
      toast.success("Poll created successfully");
      pollForm.reset();
      setPollOptions(['', '']);
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll");
    } finally {
      setIsCreatingPoll(false);
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
      // Remove from local state
      setActivePolls(activePolls.filter(poll => poll.id !== pollId));
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast.error("Failed to delete poll");
    } finally {
      setDeletingPollId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleViewPoll = (poll: any) => {
    setSelectedPoll(poll);
    fetchPollResponses(poll.id);
    setViewDialogOpen(true);
  };

  const calculateOptionPercentages = () => {
    if (!selectedPoll || pollResponses.length === 0) return {};
    
    const optionCounts = {};
    pollResponses.forEach(response => {
      if (optionCounts[response.selected_option]) {
        optionCounts[response.selected_option]++;
      } else {
        optionCounts[response.selected_option] = 1;
      }
    });
    
    const optionPercentages = {};
    Object.keys(optionCounts).forEach(option => {
      optionPercentages[option] = (optionCounts[option] / pollResponses.length) * 100;
    });
    
    return { counts: optionCounts, percentages: optionPercentages };
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
        <h1 className="text-3xl font-bold text-rgukt-blue mb-6">Manage Polls</h1>
        
        <div className="mb-6">
          <Link to="/admin">
            <Button variant="outline" className="text-rgukt-blue border-rgukt-blue">
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        {/* Student Stats Card */}
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/80 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-600">Total Students</h3>
                  <p className="text-3xl font-bold text-rgukt-blue">{totalStudents}</p>
                </div>
                <div className="text-center p-4 bg-white/80 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-600">Active Polls</h3>
                  <p className="text-3xl font-bold text-rgukt-blue">{activePolls.length}</p>
                </div>
                <div className="text-center p-4 bg-white/80 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-600">Total Votes</h3>
                  <p className="text-3xl font-bold text-rgukt-blue">
                    {activePolls.reduce((sum, poll) => sum + poll.votes, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue">Create New Poll</CardTitle>
                <CardDescription>
                  Create a new poll to gather feedback from students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={pollForm.handleSubmit(handleCreatePoll)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Poll Title</Label>
                    <Input 
                      id="title"
                      placeholder="Enter poll title"
                      {...pollForm.register("title", { required: true })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description"
                      placeholder="Enter poll description"
                      {...pollForm.register("description", { required: true })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input 
                      id="endDate"
                      type="date"
                      {...pollForm.register("endDate", { required: true })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Poll Options</Label>
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex space-x-2">
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
                            onClick={() => removeOption(index)}
                            className="text-red-500"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addOption}
                      className="mt-2"
                    >
                      Add Option
                    </Button>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-rgukt-blue hover:bg-rgukt-lightblue"
                    disabled={isCreatingPoll}
                  >
                    {isCreatingPoll ? "Creating..." : "Create Poll"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue">Active Polls</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-rgukt-blue" />
                  </div>
                ) : activePolls.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activePolls.map(poll => (
                        <TableRow key={poll.id}>
                          <TableCell className="font-medium">{poll.title}</TableCell>
                          <TableCell>{formatDate(poll.end_date)}</TableCell>
                          <TableCell>{poll.votes}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewPoll(poll)}
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
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-rgukt-blue">{selectedPoll?.title}</DialogTitle>
            <DialogDescription className="text-gray-600">
              Created on {selectedPoll?.created_at && formatDate(selectedPoll.created_at)} • Ends on {selectedPoll?.end_date && formatDate(selectedPoll.end_date)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 my-4">
            <div>
              <h3 className="text-lg font-medium">Description:</h3>
              <p className="mt-1 text-gray-600">{selectedPoll?.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Poll Options</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPoll?.options && (
                    <ul className="space-y-2">
                      {selectedPoll.options.map((option, index) => {
                        const results = calculateOptionPercentages();
                        const count = results.counts?.[option] || 0;
                        const percentage = results.percentages?.[option] || 0;
                        
                        return (
                          <li key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{option}</span>
                              <span>{count} votes ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-rgukt-blue h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Responses ({pollResponses.length})</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[300px] overflow-y-auto">
                  {loadingResponses ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-rgukt-blue" />
                    </div>
                  ) : pollResponses.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Selected Option</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pollResponses.map(response => (
                          <TableRow key={response.id}>
                            <TableCell>{response.profiles?.username || response.user_id}</TableCell>
                            <TableCell>{response.selected_option}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-4 text-gray-500">No responses yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                setConfirmDeleteId(selectedPoll?.id);
                setViewDialogOpen(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Poll
            </Button>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog for Deleting Polls */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the poll and all votes associated with it. This action cannot be undone.
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
