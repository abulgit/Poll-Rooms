import rateLimit, { type Options } from "express-rate-limit";
import {
  VOTE_RATE_LIMIT_WINDOW_MS,
  VOTE_RATE_LIMIT_MAX,
  POLL_CREATION_RATE_LIMIT_WINDOW_MS,
  POLL_CREATION_RATE_LIMIT_MAX,
} from "../lib/constants";

// Rate limit per IP + pollId combo to prevent vote flooding on a single poll
const voteKeyGenerator: Options["keyGenerator"] = (req, res) => {
  const pollId = req.params.pollId ?? "unknown";
  const ip = rateLimit.defaultKeyGenerator(req, res);
  return `${ip}:${pollId}`;
};

export const voteRateLimiter = rateLimit({
  windowMs: VOTE_RATE_LIMIT_WINDOW_MS,
  max: VOTE_RATE_LIMIT_MAX,
  message: { error: "Too many votes from this IP. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: voteKeyGenerator,
});

export const pollCreationRateLimiter = rateLimit({
  windowMs: POLL_CREATION_RATE_LIMIT_WINDOW_MS,
  max: POLL_CREATION_RATE_LIMIT_MAX,
  message: { error: "Too many polls created. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
