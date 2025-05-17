
import React from 'react';
import { Link } from 'react-router-dom';
import { PollWithVotes } from '@/types/poll';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from 'lucide-react';

interface PollCardProps {
  poll: PollWithVotes;
  isActive: boolean;
}

const PollCard = ({ poll, isActive }: PollCardProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="text-rgukt-blue text-xl">{poll.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {poll.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
          <span>{isActive ? 'Ends' : 'Ended'}: {formatDate(poll.end_date)}</span>
          <span>{poll.total_votes} votes</span>
        </div>
        
        {/* Show top two options with vote counts */}
        {poll.options.slice(0, 2).map((option, idx) => (
          <div key={idx} className="mt-2">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="truncate max-w-[70%]">{option}</span>
              <span>{poll.option_votes[option] || 0} votes</span>
            </div>
            <Progress 
              value={(poll.total_votes > 0) 
                ? (poll.option_votes[option] || 0) / poll.total_votes * 100 
                : 0} 
              className="h-1.5" 
            />
          </div>
        ))}
        
        {poll.options.length > 2 && (
          <p className="text-xs text-gray-500 mt-2">+{poll.options.length - 2} more options</p>
        )}
      </CardContent>
      
      <div className="p-4 pt-0 mt-2">
        <Link to={`/polls/${poll.id}`}>
          <Button 
            className={`w-full flex items-center justify-center gap-2 ${
              isActive 
                ? 'bg-rgukt-blue hover:bg-rgukt-lightblue' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <span>{isActive ? (poll.has_voted ? 'View Results' : 'Vote Now') : 'View Results'}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default PollCard;
