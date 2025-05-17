
export interface Poll {
  id: string;
  title: string;
  description: string;
  options: string[];
  end_date: string;
  created_at: string;
  created_by: string;
}

export interface PollResponse {
  id: string;
  poll_id: string;
  user_id: string;
  selected_option: string;
  created_at: string;
}

export interface PollWithVotes extends Poll {
  total_votes: number;
  option_votes: Record<string, number>;
  has_voted?: boolean;
  user_vote?: string;
}
