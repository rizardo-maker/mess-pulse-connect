
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Complaints = () => {
  const [images, setImages] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...filesArray]);
      
      // Create preview URLs
      const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      toast.error("Please add a title to your complaint");
      return;
    }
    
    if (!description.trim()) {
      toast.error("Please describe your complaint");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate submission for now (will integrate with Supabase later)
    try {
      // Delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Your complaint has been submitted successfully!");
      setTitle('');
      setDescription('');
      setImages([]);
      setPreviewUrls([]);
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
        <h1 className="text-3xl font-bold text-rgukt-blue mb-8">Submit a Complaint</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue">Complaint Form</CardTitle>
                <CardDescription>
                  Please provide details about the issue you're experiencing with the mess services.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Complaint Title</Label>
                    <Input 
                      id="title"
                      placeholder="Enter a brief title for your complaint"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description"
                      placeholder="Describe your complaint in detail"
                      className="min-h-[150px]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="images">Upload Images (Optional)</Label>
                    <Input 
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    
                    {previewUrls.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={url} 
                              alt={`Preview ${index + 1}`} 
                              className="h-24 w-24 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="bg-rgukt-blue hover:bg-rgukt-lightblue w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Complaint"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">1. Submit Your Complaint</h3>
                  <p className="text-sm text-gray-600">Fill out the form with details about your issue. Add images if needed.</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">2. Review Process</h3>
                  <p className="text-sm text-gray-600">Mess office staff will review your complaint within 24-48 hours.</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">3. Resolution</h3>
                  <p className="text-sm text-gray-600">You'll receive notification when your complaint has been addressed.</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-rgukt-blue">
                    For urgent matters, please contact the mess supervisor directly at 
                    <span className="font-semibold"> mess-supervisor@rguktsklm.ac.in</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Complaints;
