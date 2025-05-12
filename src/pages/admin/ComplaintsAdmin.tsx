
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, MessageSquare, Eye, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const ComplaintsAdmin = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingComplaintId, setDeletingComplaintId] = useState<string | null>(null);

  useEffect(() => {
    fetchComplaints();
    
    // Set up real-time subscription for complaints
    const complaintsChannel = supabase
      .channel('admin-complaints-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'complaints' },
        () => {
          fetchComplaints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(complaintsChannel);
    };
  }, [activeTab]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      // First, get the complaints
      let query = supabase
        .from('complaints')
        .select('*');
      
      // Filter based on active tab
      if (activeTab === "pending") {
        query = query.eq('status', 'Pending');
      } else if (activeTab === "resolved") {
        query = query.eq('status', 'Resolved');
      } else if (activeTab === "rejected") {
        query = query.eq('status', 'Rejected');
      }
      
      // Order by creation date, newest first
      query = query.order('created_at', { ascending: false });
      
      const { data: complaintsData, error: complaintsError } = await query;
      
      if (complaintsError) throw complaintsError;
      
      // If we have complaints, fetch user profiles separately and join them in JavaScript
      if (complaintsData && complaintsData.length > 0) {
        // Get unique user IDs from complaints
        const userIds = [...new Set(complaintsData.map(complaint => complaint.user_id))];
        
        // Fetch profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);
          
        if (profilesError) throw profilesError;
        
        // Create a lookup object for quick profile access
        const profilesLookup = (profilesData || []).reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
        
        // Join the data
        const completeData = complaintsData.map(complaint => ({
          ...complaint,
          profile: profilesLookup[complaint.user_id] || null
        }));
        
        setComplaints(completeData);
      } else {
        setComplaints([]);
      }
      
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success(`Complaint ${status.toLowerCase()} successfully`);
      fetchComplaints();
    } catch (error) {
      console.error(`Error updating complaint status:`, error);
      toast.error("Failed to update complaint status");
    }
  };

  const deleteComplaint = async (id: string) => {
    setDeletingComplaintId(id);
    try {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Complaint deleted successfully");
      // Remove from the local state
      setComplaints(complaints.filter(complaint => complaint.id !== id));
      // Close the dialog
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting complaint:", error);
      toast.error("Failed to delete complaint");
    } finally {
      setDeletingComplaintId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'Resolved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>;
      case 'Rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-rgukt-blue">Manage Complaints</h1>
          <Link to="/admin">
            <Button variant="outline" className="text-rgukt-blue border-rgukt-blue">
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          
          {['pending', 'resolved', 'rejected'].map((status) => (
            <TabsContent key={status} value={status}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-rgukt-blue">
                    {status.charAt(0).toUpperCase() + status.slice(1)} Complaints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-10 w-10 animate-spin text-rgukt-blue" />
                    </div>
                  ) : complaints.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Submitted on</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {complaints.map((complaint) => (
                            <TableRow key={complaint.id}>
                              <TableCell className="font-medium">{complaint.title}</TableCell>
                              <TableCell>{complaint.profile?.username || complaint.user_id}</TableCell>
                              <TableCell>{formatDate(complaint.created_at)}</TableCell>
                              <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                    onClick={() => {
                                      setSelectedComplaint(complaint);
                                      setViewDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  
                                  {complaint.status === 'Pending' && (
                                    <>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-green-600 border-green-600 hover:bg-green-50"
                                        onClick={() => updateComplaintStatus(complaint.id, 'Resolved')}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-red-600 border-red-600 hover:bg-red-50"
                                        onClick={() => updateComplaintStatus(complaint.id, 'Rejected')}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      setSelectedComplaint(complaint);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No {status} complaints found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* View Complaint Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-rgukt-blue">
              {selectedComplaint?.title}
            </DialogTitle>
            <DialogDescription className="text-md text-gray-500">
              Submitted by {selectedComplaint?.profile?.username || selectedComplaint?.user_id} on {selectedComplaint?.created_at && formatDate(selectedComplaint.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div>
              <h3 className="text-lg font-medium">Description:</h3>
              <p className="mt-1 whitespace-pre-wrap">{selectedComplaint?.description}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Status:</h3>
              <div className="mt-1">{selectedComplaint?.status && getStatusBadge(selectedComplaint.status)}</div>
            </div>
            
            {selectedComplaint?.images && selectedComplaint.images.length > 0 && (
              <div>
                <h3 className="text-lg font-medium">Attached Images:</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {selectedComplaint.images.map((imageUrl, index) => (
                    <a key={index} href={imageUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={imageUrl} alt={`Attachment ${index + 1}`} className="rounded-md object-cover w-full h-40" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {selectedComplaint?.status === 'Pending' && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => {
                    updateComplaintStatus(selectedComplaint.id, 'Resolved');
                    setViewDialogOpen(false);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => {
                    updateComplaintStatus(selectedComplaint.id, 'Rejected');
                    setViewDialogOpen(false);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Complaint
                </Button>
              </div>
            )}
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the complaint. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedComplaint && deleteComplaint(selectedComplaint.id)}
              disabled={!!deletingComplaintId}
            >
              {deletingComplaintId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default ComplaintsAdmin;
