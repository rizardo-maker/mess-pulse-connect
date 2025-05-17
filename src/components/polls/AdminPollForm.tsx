
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, X } from 'lucide-react';

interface AdminPollFormProps {
  onSuccess: () => void;
}

const AdminPollForm = ({ onSuccess }: AdminPollFormProps) => {
  const { user } = useAuth();
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
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
  
  const onCreatePoll = async (data: any) => {
    // Validate options
    const validOptions = pollOptions.filter(option => option.trim() !== '');
    
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options for the poll");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('polls')
        .insert({
          title: data.title,
          description: data.description,
          end_date: data.endDate,
          options: validOptions,
          created_by: user?.id,
          allow_multiple_votes: allowMultipleVotes,
          is_anonymous: isAnonymous
        });
      
      if (error) throw error;
      
      toast.success("Poll created successfully");
      reset();
      setPollOptions(['', '']);
      setAllowMultipleVotes(false);
      setIsAnonymous(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll");
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onCreatePoll)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Poll Title</Label>
        <Input 
          id="title"
          placeholder="Enter poll title"
          {...register("title", { required: "Title is required" })}
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && (
          <p className="text-red-500 text-sm">{errors.title.message as string}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description"
          placeholder="Enter poll description"
          {...register("description", { required: "Description is required" })}
          className={errors.description ? "border-red-500" : ""}
        />
        {errors.description && (
          <p className="text-red-500 text-sm">{errors.description.message as string}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="endDate">End Date</Label>
        <Input 
          id="endDate"
          type="date"
          min={new Date().toISOString().split('T')[0]}
          {...register("endDate", { required: "End date is required" })}
          className={errors.endDate ? "border-red-500" : ""}
        />
        {errors.endDate && (
          <p className="text-red-500 text-sm">{errors.endDate.message as string}</p>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="allowMultipleVotes" className="cursor-pointer">Allow multiple options selection</Label>
          <Switch 
            id="allowMultipleVotes" 
            checked={allowMultipleVotes}
            onCheckedChange={setAllowMultipleVotes}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="isAnonymous" className="cursor-pointer">Anonymous voting</Label>
          <Switch 
            id="isAnonymous" 
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Poll Options</Label>
        <p className="text-sm text-gray-500 mb-2">Add at least 2 options for your poll</p>
        
        {pollOptions.map((option, index) => (
          <div key={index} className="flex space-x-2 mb-2">
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
                size="icon"
                onClick={() => removeOption(index)}
                className="text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={addOption}
          className="mt-2 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Option
        </Button>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-rgukt-blue hover:bg-rgukt-lightblue"
      >
        Create Poll
      </Button>
    </form>
  );
};

export default AdminPollForm;
