import { prisma } from "@/lib/db";
import type { Poll, PollResults } from "@/types";

export async function createPoll(
  question: string,
  options: string[],
  creatorIp: string | undefined
): Promise<{ pollId: string }> {
  const poll = await prisma.poll.create({
    data: {
      question,
      creatorIp:
       creatorIp ?? null,
      options: {
        create: options.map((text, index) => ({
          text,
          position: index,
        })),
      },
    },
    select: { id: true },
  });

  return { pollId: poll.id };
}

export async function getPollById(pollId: string): Promise<Poll | null> {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        orderBy: { position: "asc" },
        include: {
          _count: { select: { votes: true } },
        },
      },
    },
  });

  if (!poll) return null;

  return {
    id: poll.id,
    question: poll.question,
    createdAt: poll.createdAt.toISOString(),
    options: poll.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      votes: opt._count.votes,
    })),
  };
}

export async function getPollResults(pollId: string): Promise<PollResults | null> {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        orderBy: { position: "asc" },
        include: {
          _count: { select: { votes: true } },
        },
      },
      _count: { select: { votes: true } },
    },
  });

  if (!poll) return null;

  return {
    question: poll.question,
    totalVotes: poll._count.votes,
    options: poll.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      votes: opt._count.votes,
    })),
  };
}
