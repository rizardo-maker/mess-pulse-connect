
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Trash } from 'lucide-react';

interface Complaint {
  id: string;
  title: string;
  description: string;
  created_at: string;
  user_email: string;
  status: string;
  images?: string[];
}

const ComplaintsAdmin = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          profiles:user_id (username, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedComplaints = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          created_at: new Date(item.created_at).toLocaleDateString(),
          user_email: item.profiles?.email || 'Unknown user',
          status: item.status || 'Pending',
          images: item.images
        }));
        
        setComplaints(formattedComplaints);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const deleteComplaint = async (id: string) => {
    if (!confirm("Are you sure you want to delete this complaint?")) return;
    
    try {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setComplaints(complaints.filter(complaint => complaint.id !== id));
      toast.success("Complaint deleted successfully");
    } catch (error) {
      console.error("Error deleting complaint:", error);
      toast.error("Failed to delete complaint");
    }
  };

  const updateComplaintStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      setComplaints(complaints.map(complaint => 
        complaint.id === id ? { ...complaint, status } : complaint
      ));
      toast.success(`Complaint marked as ${status}`);
    } catch (error) {
      console.error("Error updating complaint status:", error);
      toast.error("Failed to update complaint status");
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-rgukt-blue mb-6">Manage Complaints</h1>
        
        <div className="mb-6">
          <Link to="/admin">
            <Button variant="outline" className="text-rgukt-blue border-rgukt-blue">
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-rgukt-blue">Student Complaints</CardTitle>
            <CardDescription>
              Review and respond to complaints submitted by students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading complaints...</div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No complaints submitted yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell>{complaint.created_at}</TableCell>
                        <TableCell>{complaint.user_email}</TableCell>
                        <TableCell>
                          <div className="font-medium">{complaint.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[200px]">
                            {complaint.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            complaint.status === 'Resolved' 
                              ? 'bg-green-100 text-green-800' 
                              : complaint.status === 'In Progress' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {complaint.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => updateComplaintStatus(complaint.id, 'In Progress')}
                              className="text-blue-600"
                              disabled={complaint.status === 'In Progress'}
                            >
                              Mark In Progress
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => updateComplaintStatus(complaint.id, 'Resolved')}
                              className="text-green-600"
                              disabled={complaint.status === 'Resolved'}
                            >
                              Mark Resolved
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => deleteComplaint(complaint.id)}
                              className="text-red-600"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ComplaintsAdmin;
