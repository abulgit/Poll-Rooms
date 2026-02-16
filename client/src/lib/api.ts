import type {
  Poll,
  CreatePollRequest,
  CreatePollResponse,
  VoteRequest,
  VoteResponse,
  ApiError,
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();

  if (!res.ok) {
    const error = data as ApiError;
    throw new Error(error.error || "Something went wrong");
  }

  return data as T;
}

export async function createPoll(data: CreatePollRequest): Promise<CreatePollResponse> {
  const res = await fetch(`${API_BASE}/polls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<CreatePollResponse>(res);
}

export async function getPoll(pollId: string): Promise<Poll> {
  const res = await fetch(`${API_BASE}/polls/${pollId}`);
  return handleResponse<Poll>(res);
}

export async function submitVote(pollId: string, data: VoteRequest): Promise<VoteResponse> {
  const res = await fetch(`${API_BASE}/polls/${pollId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok) {
    return json as VoteResponse;
  }

  return json as VoteResponse;
}

export function createPollStream(pollId: string): EventSource {
  return new EventSource(`${API_BASE}/polls/${pollId}/stream`);
}
