
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activePolls, setActivePolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    fetchActivePolls();

    // Set up subscription for real-time updates
    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

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

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(pollsChannel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivePolls = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .gte('end_date', today)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      setActivePolls(data || []);
    } catch (error) {
      console.error("Error fetching polls:", error);
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - Notifications */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-rgukt-blue mb-6">Notifications & Updates</h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-rgukt-blue" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-6">
                {notifications.map(notification => (
                  <Card key={notification.id} className={notification.important ? "border-l-4 border-l-rgukt-gold" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg text-rgukt-blue">{notification.title}</CardTitle>
                        <span className="text-sm text-gray-500">{formatDate(notification.created_at)}</span>
                      </div>
                      {notification.important && (
                        <span className="bg-rgukt-gold text-rgukt-blue text-xs px-2 py-1 rounded-full inline-block">
                          Important
                        </span>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{notification.content}</p>
                      {notification.link && (
                        <Link to={notification.link}>
                          <Button variant="outline" size="sm" className="text-rgukt-blue border-rgukt-blue hover:bg-rgukt-blue hover:text-white">
                            View Details
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">No notifications available at the moment.</p>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link to="/complaints">
                  <Button className="w-full bg-rgukt-blue hover:bg-rgukt-lightblue">
                    Submit a Complaint
                  </Button>
                </Link>
                <Link to="/polls">
                  <Button variant="outline" className="w-full border-rgukt-blue text-rgukt-blue hover:bg-rgukt-blue hover:text-white">
                    View Active Polls
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Active Polls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue">Active Polls</CardTitle>
                <CardDescription>Have your say in the mess decisions</CardDescription>
              </CardHeader>
              <CardContent>
                {activePolls.length > 0 ? (
                  activePolls.map(poll => (
                    <div key={poll.id} className="mb-4">
                      <h3 className="font-medium">{poll.title}</h3>
                      <p className="text-sm text-gray-500 mb-2">Ends on: {formatDate(poll.end_date)}</p>
                      <Separator className="my-2" />
                      <Link to={`/polls/${poll.id}`}>
                        <Button size="sm" className="mt-2 bg-rgukt-blue hover:bg-rgukt-lightblue">
                          Vote Now
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No active polls at the moment.</p>
                )}
              </CardContent>
            </Card>
            
            {/* Mess Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue">Mess Timings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Breakfast</span>
                    <span>7:30 AM - 9:00 AM</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Lunch</span>
                    <span>12:30 PM - 2:30 PM</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Snacks</span>
                    <span>5:00 PM - 6:00 PM</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Dinner</span>
                    <span>7:30 PM - 9:30 PM</span>
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

export default Index;
