import { prisma } from "@/lib/db";
import type { PollResults } from "@/types";
import { getPollResults } from "@/services/pollService";

interface VoteResult {
  success: boolean;
  results: PollResults | null;
  error?: string;
}

export async function submitVote(
  pollId: string,
  optionId: string,
  fingerprint: string,
  voterIp: string
): Promise<VoteResult> {
  // Verify the poll exists and the option belongs to it
  const option = await prisma.option.findFirst({
    where: { id: optionId, pollId },
  });

  if (!option) {
    return { success: false, results: null, error: "Invalid option for this poll" };
  }

  try {
    await prisma.vote.create({
      data: {
        pollId,
        optionId,
        voterFingerprint: fingerprint,
        voterIp: voterIp,
      },
    });
  } catch (err: unknown) {
    // Prisma unique constraint violation (duplicate vote)
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      const results = await getPollResults(pollId);
      return { success: false, results, error: "You have already voted on this poll" };
    }
    throw err;
  }

  const results = await getPollResults(pollId);
  return { success: true, results };
}
