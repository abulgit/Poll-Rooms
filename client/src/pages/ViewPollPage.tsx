import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getPoll, submitVote } from "@/lib/api";
import { getFingerprint } from "@/lib/fingerprint";
import { useRealtimePoll } from "@/hooks/useRealtimePoll";
import { toast } from "sonner";
import { CheckCircle, Copy, Loader2, Radio, Vote, Wifi, WifiOff } from "lucide-react";
import type { Poll, PollOption } from "@/types";

export default function ViewPollPage() {
  const { pollId } = useParams<{ pollId: string }>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const { results, isConnected } = useRealtimePoll(pollId);

  // Fetch initial poll data
  useEffect(() => {
    if (!pollId) return;

    async function fetchPoll() {
      try {
        const data = await getPoll(pollId!);
        setPoll(data);
      } catch {
        setError("Poll not found");
      } finally {
        setLoading(false);
      }
    }

    fetchPoll();
  }, [pollId]);

  useEffect(() => {
    if (pollId) {
      const voted = localStorage.getItem(`voted:${pollId}`);
      if (voted) setHasVoted(true);
    }
  }, [pollId]);

  async function handleVote() {
    if (!pollId || !selectedOption) return;

    setIsVoting(true);
    try {
      const fingerprint = getFingerprint();
      const result = await submitVote(pollId, {
        optionId: selectedOption,
        fingerprint,
      });

      if (result.success) {
        setHasVoted(true);
        localStorage.setItem(`voted:${pollId}`, "true");
        toast.success("Vote submitted!");
      } else {
        toast.error(result.error ?? "Failed to vote");
        if (result.error?.includes("already voted")) {
          setHasVoted(true);
          localStorage.setItem(`voted:${pollId}`, "true");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setIsVoting(false);
    }
  }

  function copyShareLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard!");
    });
  }

  // Use live results if available, otherwise fall back to poll data
  const displayOptions = results?.options ?? poll?.options ?? [];
  const totalVotes = results?.totalVotes ?? displayOptions.reduce((sum, o) => sum + o.votes, 0);
  const displayQuestion = results?.question ?? poll?.question ?? "";

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-svh flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Poll Not Found</CardTitle>
            <CardDescription>This poll doesn't exist or has been removed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button variant="outline">Create a New Poll</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vote className="h-5 w-5 text-primary" />
              <Badge variant="secondary">
                {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="outline" className="gap-1 text-green-600">
                  <Wifi className="h-3 w-3" /> Live
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <WifiOff className="h-3 w-3" /> Offline
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={copyShareLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardTitle className="text-xl mt-2">{displayQuestion}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasVoted ? (
            <>
              {displayOptions.map((option: PollOption) => {
                const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                return (
                  <div key={option.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{option.text}</span>
                      <span className="text-muted-foreground">
                        {option.votes} ({percentage}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
              <div className="pt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-600" />
                You have voted on this poll
              </div>
            </>
          ) : (
            <>
              {displayOptions.map((option: PollOption) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOption(option.id)}
                  className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent ${
                    selectedOption === option.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <Radio
                    className={`h-4 w-4 shrink-0 ${
                      selectedOption === option.id ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span className="font-medium">{option.text}</span>
                </button>
              ))}

              <Button
                className="w-full mt-2"
                onClick={handleVote}
                disabled={!selectedOption || isVoting}
              >
                {isVoting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Voting...
                  </>
                ) : (
                  "Submit Vote"
                )}
              </Button>
            </>
          )}

          <div className="pt-2 border-t">
            <Link to="/">
              <Button variant="link" size="sm" className="p-0 text-muted-foreground">
                Create your own poll
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
