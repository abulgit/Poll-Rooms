import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPoll } from "@/lib/api";
import { Plus, Trash2, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function CreatePollPage() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function addOption() {
    if (options.length >= 10) return;
    setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  }

  function updateOption(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  }

  function resetForm() {
    setQuestion("");
    setOptions(["", ""]);
    setShareUrl(null);
    setCopied(false);
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  function openPoll() {
    if (!shareUrl) return;
    window.open(shareUrl, "_blank");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);

    if (trimmedQuestion.length < 10) {
      toast.error("Question must be at least 10 characters");
      return;
    }

    if (trimmedOptions.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createPoll({
        question: trimmedQuestion,
        options: trimmedOptions,
      });
      setShareUrl(response.shareUrl);
      toast.success("Poll created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create poll");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create a Poll</CardTitle>
          <CardDescription>
            Ask a question and add options for people to vote on.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                placeholder="What's your favorite programming language?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={500}
                required
              />
              <p className="text-xs text-muted-foreground">
                {question.length}/500 characters (min 10)
              </p>
            </div>

            <div className="space-y-3">
              <Label>Options</Label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    maxLength={200}
                    required
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {options.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                {options.length}/10 options (min 2)
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Poll"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Share Link Dialog */}
      <Dialog open={!!shareUrl} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Poll Created!</DialogTitle>
            <DialogDescription>
              Share this link with others so they can vote on your poll.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl ?? ""}
                className="font-mono text-sm"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={copyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={openPoll} className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Poll
              </Button>
              <Button variant="outline" onClick={resetForm} className="flex-1">
                Create Another
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
