
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Database, 
  BarChart4, 
  Settings, 
  Users, 
  Vote, 
  MessageSquareWarning 
} from "lucide-react";

const SystemSummary = () => {
  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="mb-8">
          <CardHeader className="bg-rgukt-blue text-white">
            <CardTitle className="text-2xl">RGUKT Mess Portal System Summary</CardTitle>
            <CardDescription className="text-gray-100">
              A comprehensive overview of the system's architecture and functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-700 mb-4">
              The RGUKT Mess Portal is designed to facilitate efficient communication between students 
              and mess administration. It enables feedback collection, complaint management, and 
              polling for mess-related decisions, creating a more transparent and responsive dining experience.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="how-it-works" className="w-full">
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
            <TabsTrigger value="methods">Methods Used</TabsTrigger>
            <TabsTrigger value="functionalities">Functionalities</TabsTrigger>
            <TabsTrigger value="data-storage">Data Storage</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          </TabsList>
          
          <TabsContent value="how-it-works">
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue flex items-center gap-2">
                  <Settings className="h-5 w-5" /> How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">System Architecture</h3>
                  <p>
                    The RGUKT Mess Portal employs a modern web application architecture with a clear separation of concerns:
                  </p>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Frontend: React-based user interface with responsive design</li>
                    <li>Backend: Supabase platform providing backend-as-a-service functionality</li>
                    <li>Authentication: JWT-based auth system with role-based access control</li>
                    <li>Real-time communications: WebSocket connections for live updates</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">User Flow</h3>
                  <p>
                    The system supports multiple user flows:
                  </p>
                  <ol className="list-decimal ml-6 mt-2 space-y-1">
                    <li>Users authenticate with email/password credentials</li>
                    <li>Role-based access directs users to appropriate interfaces (admin vs. student)</li>
                    <li>Students can submit complaints, participate in polls, and view notifications</li>
                    <li>Administrators can manage complaints, create polls, and publish notifications</li>
                    <li>Real-time updates ensure all users see the latest information without refreshing</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="methods">
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue flex items-center gap-2">
                  <BarChart4 className="h-5 w-5" /> Methods Used
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Development Technologies</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li><span className="font-medium">React:</span> Component-based UI development</li>
                    <li><span className="font-medium">TypeScript:</span> Static typing for improved code quality</li>
                    <li><span className="font-medium">Tailwind CSS:</span> Utility-first CSS framework for responsive design</li>
                    <li><span className="font-medium">Shadcn UI:</span> Accessible component library based on Radix UI</li>
                    <li><span className="font-medium">React Router:</span> Client-side routing for single-page application</li>
                    <li><span className="font-medium">Recharts:</span> React chart library for data visualization</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Backend Methods</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li><span className="font-medium">Supabase:</span> PostgreSQL database with RESTful and realtime APIs</li>
                    <li><span className="font-medium">Row Level Security (RLS):</span> Fine-grained access control at the database level</li>
                    <li><span className="font-medium">JWT Authentication:</span> Secure token-based authentication</li>
                    <li><span className="font-medium">WebSockets:</span> Real-time data synchronization across clients</li>
                    <li><span className="font-medium">Edge Functions:</span> Serverless functions for backend logic</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">State Management</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li><span className="font-medium">React Context API:</span> For global state management (e.g., authentication)</li>
                    <li><span className="font-medium">React Query:</span> For server state management and data fetching</li>
                    <li><span className="font-medium">Local Component State:</span> For UI-specific state management</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="functionalities">
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue flex items-center gap-2">
                  <Users className="h-5 w-5" /> Core Functionalities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">User Management</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Secure authentication with email/password</li>
                    <li>Role-based access control (admin vs. student)</li>
                    <li>User profiles with customizable information</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Complaint System</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Students can submit detailed complaints about mess services</li>
                    <li>Support for image attachments to document issues</li>
                    <li>Status tracking for complaint resolution</li>
                    <li>Admin interface for reviewing and managing complaints</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-1">
                    <Vote className="h-4 w-4" /> Dynamic Polling System
                  </h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>WhatsApp-like polls with real-time vote counts</li>
                    <li>Support for single-choice and multiple-choice polls</li>
                    <li>Anonymous voting option for sensitive topics</li>
                    <li>Time-limited polls with automatic closure</li>
                    <li>Real-time updates as votes are cast</li>
                    <li>Visual representations of voting results with percentages</li>
                    <li>Vote modification before poll closure</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-1">
                    <MessageSquareWarning className="h-4 w-4" /> Notification System
                  </h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Important announcements from mess administration</li>
                    <li>Real-time notification delivery</li>
                    <li>Support for browser notifications</li>
                    <li>Priority flags for urgent communications</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Visual representation of poll participation</li>
                    <li>Complaint statistics and resolution metrics</li>
                    <li>Admin-specific insights for decision making</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="data-storage">
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue flex items-center gap-2">
                  <Database className="h-5 w-5" /> Data Storage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Database Architecture</h3>
                  <p>
                    The system uses Supabase's PostgreSQL database with the following table structure:
                  </p>
                  <ul className="list-disc ml-6 mt-2 space-y-3">
                    <li>
                      <span className="font-medium">profiles:</span> 
                      <ul className="ml-6 mt-1">
                        <li>Stores user information (ID, username, role)</li>
                        <li>Links to Supabase Auth for authentication</li>
                      </ul>
                    </li>
                    <li>
                      <span className="font-medium">complaints:</span>
                      <ul className="ml-6 mt-1">
                        <li>Stores complaint details (title, description, status)</li>
                        <li>Tracks user_id for complaint ownership</li>
                        <li>Supports image attachments as array</li>
                      </ul>
                    </li>
                    <li>
                      <span className="font-medium">polls:</span>
                      <ul className="ml-6 mt-1">
                        <li>Stores poll configurations (title, description, options)</li>
                        <li>Includes settings for multiple_votes and anonymity</li>
                        <li>Tracks start/end dates for poll lifecycle</li>
                      </ul>
                    </li>
                    <li>
                      <span className="font-medium">poll_responses:</span>
                      <ul className="ml-6 mt-1">
                        <li>Records individual votes with user_id and poll_id</li>
                        <li>Supports both single and multiple selected options</li>
                        <li>Timestamp tracking for vote analytics</li>
                      </ul>
                    </li>
                    <li>
                      <span className="font-medium">notifications:</span>
                      <ul className="ml-6 mt-1">
                        <li>Stores system announcements and updates</li>
                        <li>Supports importance flagging and navigation links</li>
                      </ul>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Data Security</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Row Level Security (RLS) enforces access control at the database level</li>
                    <li>Users can only access their own data and public information</li>
                    <li>Admins have elevated permissions for system management</li>
                    <li>JWT tokens ensure secure authentication</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Real-time Data Handling</h3>
                  <p>
                    The system leverages Supabase's real-time capabilities:
                  </p>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>WebSocket connections maintain live data streams</li>
                    <li>Subscribable channels for specific data tables</li>
                    <li>Event-based architecture for reactive UI updates</li>
                    <li>Optimistic UI updates for improved user experience</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="efficiency">
            <Card>
              <CardHeader>
                <CardTitle className="text-rgukt-blue flex items-center gap-2">
                  <BarChart4 className="h-5 w-5" /> System Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Performance Optimization</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Client-side rendering with React for responsive UIs</li>
                    <li>Lazy loading of components and routes for faster initial load</li>
                    <li>Optimized database queries with proper indexing</li>
                    <li>Debounced and throttled API calls to prevent overloading</li>
                    <li>Caching strategies for frequently accessed data</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Scalability</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Serverless architecture scales automatically with demand</li>
                    <li>PostgreSQL database with horizontal scaling capabilities</li>
                    <li>Connection pooling for efficient database utilization</li>
                    <li>Cloudflare CDN for static asset delivery</li>
                    <li>Supabase's distributed architecture manages high traffic loads</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">System Limits</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li><span className="font-medium">Concurrent Users:</span> Can handle thousands of simultaneous users</li>
                    <li><span className="font-medium">Database Storage:</span> Up to 8GB on current plan, expandable</li>
                    <li><span className="font-medium">Real-time Connections:</span> Up to 500 concurrent WebSocket connections</li>
                    <li><span className="font-medium">API Rate Limits:</span> 50,000 requests per day (Free tier)</li>
                    <li><span className="font-medium">Edge Functions:</span> 100ms minimum execution time, 400KB size limit</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Future Optimizations</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Implementing server-side rendering for improved SEO</li>
                    <li>Adding offline capabilities with service workers</li>
                    <li>Further code splitting for better initial load performance</li>
                    <li>Database sharding for horizontal scaling as user base grows</li>
                    <li>Advanced caching strategies for frequently accessed data</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SystemSummary;
