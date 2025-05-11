
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
import { Loader2, Trash2 } from "lucide-react";
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

const PollsAdmin = () => {
  const { user } = useAuth();
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [activePolls, setActivePolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingPollId, setDeletingPollId] = useState<string | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);
  
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
