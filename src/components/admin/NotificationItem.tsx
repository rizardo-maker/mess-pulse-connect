
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    content: string;
    important: boolean;
    link?: string | null;
    created_at: string;
  };
  onDelete: (id: string) => void;
}

const NotificationItem = ({ notification, onDelete }: NotificationItemProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);
      
      if (error) throw error;
      
      toast.success("Notification deleted successfully");
      onDelete(notification.id);
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  return (
    <Card className={notification.important ? "border-l-4 border-l-rgukt-gold" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-rgukt-blue">{notification.title}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{formatDate(notification.created_at)}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              title="Delete notification"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
        {notification.important && (
          <span className="bg-rgukt-gold text-rgukt-blue text-xs px-2 py-1 rounded-full inline-block">
            Important
          </span>
        )}
      </CardHeader>
      <CardContent>
        <p className="mb-4">{notification.content}</p>
      </CardContent>
    </Card>
  );
};

export default NotificationItem;
