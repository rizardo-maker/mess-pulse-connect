
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const Polls = () => {
  // Active poll state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Sample active poll data
  const activePoll = {
    id: "poll-1",
    title: "Preferred Breakfast Option",
    description: "Help us determine which breakfast option to serve more frequently",
    options: [
      { id: "option-1", text: "Idli & Sambar" },
      { id: "option-2", text: "Dosa & Chutney" },
      { id: "option-3", text: "Puri & Curry" },
      { id: "option-4", text: "Upma & Chutney" },
    ],
    endDate: "2025-05-15"
  };

  // Sample past polls with results
  const pastPolls = [
    {
      id: "past-poll-1",
      title: "Mess Timing Preference",
      description: "Results from the poll on preferred mess timings",
      endDate: "2025-05-01",
      results: [
        { option: "Current timings are fine", percentage: 45 },
        { option: "Extend dinner time by 30 mins", percentage: 30 },
        { option: "Start breakfast 30 mins earlier", percentage: 25 },
      ],
      totalVotes: 320
    },
    {
      id: "past-poll-2",
      title: "Preferred Dinner Option",
      description: "Results from the poll on preferred dinner meals",
      endDate: "2025-04-20",
      results: [
        { option: "Rice & Curry", percentage: 20 },
        { option: "Roti & Curry", percentage: 35 },
        { option: "Mixed option (rice & roti both)", percentage: 45 },
      ],
      totalVotes: 280
    }
  ];

  const handleSubmitVote = async () => {
    if (!selectedOption) {
      toast.error("Please select an option before voting");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate submission (to be replaced with Supabase integration)
    try {
      // Delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Your vote has been recorded successfully!");
      setHasVoted(true);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-rgukt-blue mb-8">Polls & Feedback</h1>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="active">Active Polls</TabsTrigger>
            <TabsTrigger value="past">Past Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {activePoll ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-rgukt-blue">{activePoll.title}</CardTitle>
                      <CardDescription>
                        {activePoll.description}
                      </CardDescription>
                      <p className="text-sm text-gray-500">
                        Poll ends on: {activePoll.endDate}
                      </p>
                    </CardHeader>
                    
                    <CardContent>
                      {!hasVoted ? (
                        <RadioGroup 
                          value={selectedOption || undefined} 
                          onValueChange={setSelectedOption}
                          className="space-y-4"
                        >
                          {activePoll.options.map(option => (
                            <div key={option.id} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.id} id={option.id} />
                              <Label htmlFor={option.id} className="cursor-pointer">
                                {option.text}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : (
                        <div className="space-y-4">
                          <p className="font-medium text-green-600">Thank you for voting!</p>
                          <div className="space-y-3">
                            {activePoll.options.map((option, index) => (
                              <div key={option.id} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{option.text}</span>
                                  <span>{[45, 25, 15, 15][index]}%</span>
                                </div>
                                <Progress value={[45, 25, 15, 15][index]} className="h-2" />
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500 mt-4">
                            Total votes: 120 (Simulated data)
                          </p>
                        </div>
                      )}
                    </CardContent>
                    
                    {!hasVoted && (
                      <CardFooter>
                        <Button 
                          onClick={handleSubmitVote} 
                          disabled={isSubmitting || !selectedOption}
                          className="w-full bg-rgukt-blue hover:bg-rgukt-lightblue"
                        >
                          {isSubmitting ? "Submitting..." : "Submit Vote"}
                        </Button>
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
                      
                      <div>
                        <h3 className="font-medium mb-1">Have a suggestion?</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          If you have suggestions for future polls or mess improvements, please submit them here.
                        </p>
                        <Button variant="outline" className="w-full border-rgukt-blue text-rgukt-blue hover:bg-rgukt-blue hover:text-white">
                          Submit Suggestion
                        </Button>
                      </div>
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
            <div className="space-y-8">
              {pastPolls.map(poll => (
                <Card key={poll.id}>
                  <CardHeader>
                    <CardTitle className="text-rgukt-blue">{poll.title}</CardTitle>
                    <CardDescription>
                      {poll.description}
                    </CardDescription>
                    <p className="text-sm text-gray-500">
                      Poll ended on: {poll.endDate}
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {poll.results.map((result, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{result.option}</span>
                              <span>{result.percentage}%</span>
                            </div>
                            <Progress value={result.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-2">
                        Total votes: {poll.totalVotes}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Polls;
