
import React, { useState } from 'react';
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

const PollsAdmin = () => {
  const { user } = useAuth();
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  
  const pollForm = useForm({
    defaultValues: {
      title: '',
      description: '',
      endDate: ''
    }
  });
  
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Votes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Preferred Breakfast Option</TableCell>
                      <TableCell>2025-05-15</TableCell>
                      <TableCell>124</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Dinner Menu Feedback</TableCell>
                      <TableCell>2025-05-20</TableCell>
                      <TableCell>87</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PollsAdmin;
