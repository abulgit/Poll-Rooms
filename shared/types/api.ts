// Shared type definitions used by both client and server

export interface Poll {
  id: string;
  question: string;
  createdAt: string;
  options: PollOption[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface CreatePollRequest {
  question: string;
  options: string[];
}

export interface CreatePollResponse {
  pollId: string;
  shareUrl: string;
}

export interface VoteRequest {
  optionId: string;
  fingerprint: string;
}

export interface VoteResponse {
  success: boolean;
  results: PollResults;
  error?: string;
}

export interface PollResults {
  question: string;
  totalVotes: number;
  options: PollOption[];
}

export interface SSEMessage {
  type: "update" | "error";
  data: PollResults;
}

export interface ApiError {
  error: string;
  details?: string;
}
