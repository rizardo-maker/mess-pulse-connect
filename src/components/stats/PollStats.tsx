
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Vote, UserRound, ChartBar } from "lucide-react";
import StatsCard from "./StatsCard";

const PollStats = () => {
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [activePolls, setActivePolls] = useState(0);
  const [participationRate, setParticipationRate] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total students (visitors)
      const { count: studentCount, error: studentError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'visitor');
      
      if (studentError) throw studentError;
      setTotalStudents(studentCount || 0);
      
      // Count unique participants in polls
      const { data: participants, error: participantsError } = await supabase
        .from('poll_responses')
        .select('user_id')
        // Fix: Changed from .is('user_id', 'not.null') to .not('user_id', 'is', null)
        .not('user_id', 'is', null);
      
      if (participantsError) throw participantsError;
      
      // Count unique participants
      const uniqueParticipants = new Set();
      participants?.forEach(p => uniqueParticipants.add(p.user_id));
      setTotalParticipants(uniqueParticipants.size);
      
      // Calculate participation rate
      if (studentCount && studentCount > 0) {
        setParticipationRate(Math.round((uniqueParticipants.size / studentCount) * 100));
      }
      
      // Count active polls
      const today = new Date().toISOString().split('T')[0];
      const { count: pollCount, error: pollError } = await supabase
        .from('polls')
        .select('*', { count: 'exact', head: true })
        .gte('end_date', today);
        
      if (pollError) throw pollError;
      setActivePolls(pollCount || 0);
      
    } catch (error) {
      console.error("Error fetching poll statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-rgukt-blue" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <StatsCard 
        title="Total Students" 
        value={totalStudents} 
        icon={<UserRound className="h-6 w-6 text-blue-600" />} 
        colorClass="bg-blue-50" 
      />
      <StatsCard 
        title="Poll Participants" 
        value={totalParticipants} 
        icon={<Vote className="h-6 w-6 text-green-600" />} 
        colorClass="bg-green-50" 
      />
      <StatsCard 
        title="Participation Rate" 
        value={`${participationRate}%`} 
        icon={<ChartBar className="h-6 w-6 text-amber-600" />} 
        colorClass="bg-amber-50" 
      />
    </div>
  );
};

export default PollStats;
