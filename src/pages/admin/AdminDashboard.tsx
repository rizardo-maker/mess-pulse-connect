import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from 'react-router-dom';
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Send } from 'lucide-react';
import { Message, Poll, Dashboard } from '@/components/lucide-react-icons';
import NotificationItem from "@/components/admin/NotificationItem";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [isCreatingNotification, setIsCreatingNotification] = useState(false);
  const [quickStats, setQuickStats] = useState({
    totalStudents: 0,
    unresolvedComplaints: 0,
    activePolls: 0,
    notificationsThisWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const notificationForm = useForm({
    defaultValues: {
      title: '',
      content: '',
      important: false,
      link: '',
    }
  });

  useEffect(() => {
    fetchQuickStats();
    fetchNotifications();

    // Set up real-time subscription for stats
    const pollsChannel = supabase
      .channel('admin-polls-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'polls' },
        () => {
          fetchQuickStats();
        }
      )
      .subscribe();
      
    const complaintsChannel = supabase
      .channel('admin-complaints-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'complaints' },
        () => {
          fetchQuickStats();
        }
      )
      .subscribe();
      
    const notificationsChannel = supabase
      .channel('admin-notifications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          fetchQuickStats();
          fetchNotifications();
        }
      )
      .subscribe();
    
    // Set up real-time subscription for profiles
    const profilesChannel = supabase
      .channel('admin-profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchQuickStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pollsChannel);
      supabase.removeChannel(complaintsChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const fetchQuickStats = async () => {
    setLoading(true);
    try {
      // Get total students count
      const { count: studentsCount, error: studentsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'visitor');
      
      if (studentsError) throw studentsError;

      // Get unresolved complaints count
      const { count: unresolvedCount, error: complaintsError } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');
      
      if (complaintsError) throw complaintsError;

      // Get active polls count
      const today = new Date().toISOString().split('T')[0];
      const { count: pollsCount, error: pollsError } = await supabase
        .from('polls')
        .select('*', { count: 'exact', head: true })
        .gte('end_date', today);
      
      if (pollsError) throw pollsError;

      // Get notifications from this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { count: notificationsCount, error: notificationsError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());
      
      if (notificationsError) throw notificationsError;

      setQuickStats({
        totalStudents: studentsCount || 0,
        unresolvedComplaints: unresolvedCount || 0,
        activePolls: pollsCount || 0,
        notificationsThisWeek: notificationsCount || 0
      });

    } catch (error) {
      console.error("Error fetching quick stats:", error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoadingNotifications(false);
    }
  };

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
      fetchQuickStats(); // Refresh stats after creating notification
    } catch (error) {
      console.error("Error creating notification:", error);
      toast.error("Failed to create notification");
    } finally {
      setIsCreatingNotification(false);
    }
  };

  const handleNotificationDelete = (deletedId: string) => {
    setNotifications(notifications.filter(notification => notification.id !== deletedId));
    fetchQuickStats(); // Update the notifications count in stats
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
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="notification">Create Notification</TabsTrigger>
                    <TabsTrigger value="manage-notifications">Manage Notifications</TabsTrigger>
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
                  
                  <TabsContent value="manage-notifications">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Recent Notifications</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={fetchNotifications}
                          disabled={isLoadingNotifications}
                        >
                          Refresh
                        </Button>
                      </div>
                      
                      {isLoadingNotifications ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-pulse space-y-4 w-full">
                            <div className="h-20 bg-gray-200 rounded"></div>
                            <div className="h-20 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      ) : notifications.length > 0 ? (
                        <div className="space-y-4">
                          {notifications.map((notification) => (
                            <NotificationItem 
                              key={notification.id} 
                              notification={notification}
                              onDelete={handleNotificationDelete}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No notifications found
                        </div>
                      )}
                    </div>
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
                    {quickStats.unresolvedComplaints > 0 && (
                      <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">
                        {quickStats.unresolvedComplaints} New
                      </span>
                    )}
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
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-pulse space-y-2 w-full">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Students</span>
                      <span className="font-semibold">{quickStats.totalStudents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unresolved Complaints</span>
                      <span className="font-semibold text-red-500">{quickStats.unresolvedComplaints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Polls</span>
                      <span className="font-semibold">{quickStats.activePolls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Notifications This Week</span>
                      <span className="font-semibold">{quickStats.notificationsThisWeek}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
