
export interface Poll {
  id: string;
  title: string;
  description: string;
  options: string[];
  end_date: string;
  created_at: string;
  created_by: string;
  allow_multiple_votes: boolean;
  is_anonymous: boolean;
}

export interface PollResponse {
  id: string;
  poll_id: string;
  user_id: string;
  selected_options: string[];
  created_at: string;
}

export interface PollWithVotes extends Poll {
  total_votes: number;
  option_votes: Record<string, number>;
  has_voted?: boolean;
  user_votes?: string[];
  voters_count: number;
}

// Add new interface for poll responses with results
export interface PollResponsesData {
  poll: Poll;
  responses: Array<PollResponse & { profiles?: { username: string } }>;
  results: Record<string, number>;
  totalVotes: number;
  votersCount: number;
}
