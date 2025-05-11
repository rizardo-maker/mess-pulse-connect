
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Link } from 'react-router-dom';
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Send, Dashboard } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [isCreatingNotification, setIsCreatingNotification] = useState(false);

  const notificationForm = useForm({
    defaultValues: {
      title: '',
      content: '',
      important: false,
      link: '',
    }
  });

  const handleCreateNotification = async (formData: any) => {
    setIsCreatingNotification(true);
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          title: formData.title,
          content: formData.content,
          important: formData.important,
          link: formData.link || null,
          created_by: user?.id
        });
      
      if (error) throw error;
      
      toast.success("Notification created successfully");
      notificationForm.reset();
    } catch (error) {
      console.error("Error creating notification:", error);
      toast.error("Failed to create notification");
    } finally {
      setIsCreatingNotification(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-rgukt-blue mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dashboard className="h-5 w-5" />
                  Admin Controls
                </CardTitle>
                <CardDescription>Manage mess operations, notifications, and user data</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="notification" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-6">
                    <TabsTrigger value="notification">Notifications</TabsTrigger>
                    <TabsTrigger value="links">Quick Links</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="notification">
                    <form onSubmit={notificationForm.handleSubmit(handleCreateNotification)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Notification Title</Label>
                        <Input 
                          id="title"
                          placeholder="Enter notification title"
                          {...notificationForm.register("title", { required: true })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="content">Content</Label>
                        <Textarea 
                          id="content"
                          placeholder="Enter notification content"
                          className="min-h-[100px]"
                          {...notificationForm.register("content", { required: true })}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="important"
                          className="rounded border-gray-300"
                          {...notificationForm.register("important")}
                        />
                        <Label htmlFor="important">Mark as important</Label>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="link">Link (Optional)</Label>
                        <Input 
                          id="link"
                          placeholder="Enter a link for the notification (optional)"
                          {...notificationForm.register("link")}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-rgukt-blue hover:bg-rgukt-lightblue"
                        disabled={isCreatingNotification}
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        {isCreatingNotification ? "Creating..." : "Create Notification"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="links">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="link-title">Link Title</Label>
                        <Input id="link-title" placeholder="Enter link title" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="link-url">URL</Label>
                        <Input id="link-url" placeholder="Enter URL" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="link-description">Description (Optional)</Label>
                        <Textarea id="link-description" placeholder="Enter link description" />
                      </div>
                      
                      <Button className="w-full bg-rgukt-blue hover:bg-rgukt-lightblue">
                        Add Quick Link
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue">Admin Navigation</CardTitle>
                <CardDescription>Manage various aspects of the mess portal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link to="/admin/complaints">
                  <Button variant="outline" className="w-full text-left justify-start border-rgukt-blue text-rgukt-blue hover:bg-rgukt-blue hover:text-white">
                    <span className="flex items-center">
                      <Message className="mr-2 h-4 w-4" />
                      Manage Complaints
                    </span>
                    <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">
                      New
                    </span>
                  </Button>
                </Link>
                
                <Link to="/admin/polls">
                  <Button variant="outline" className="w-full text-left justify-start border-rgukt-blue text-rgukt-blue hover:bg-rgukt-blue hover:text-white">
                    <Poll className="mr-2 h-4 w-4" />
                    Manage Polls
                  </Button>
                </Link>
                
                <hr className="my-2" />
                
                <Link to="/">
                  <Button variant="outline" className="w-full text-left justify-start">
                    View Student Portal
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Students</span>
                    <span className="font-semibold">1,245</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unresolved Complaints</span>
                    <span className="font-semibold text-red-500">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Polls</span>
                    <span className="font-semibold">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Notifications This Week</span>
                    <span className="font-semibold">5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
