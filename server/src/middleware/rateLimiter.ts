import rateLimit from "express-rate-limit";
import {
  VOTE_RATE_LIMIT_WINDOW_MS,
  VOTE_RATE_LIMIT_MAX,
  POLL_CREATION_RATE_LIMIT_WINDOW_MS,
  POLL_CREATION_RATE_LIMIT_MAX,
} from "../lib/constants";

export const voteRateLimiter = rateLimit({
  windowMs: VOTE_RATE_LIMIT_WINDOW_MS,
  max: VOTE_RATE_LIMIT_MAX,
  message: { error: "Too many votes from this IP. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const pollId = req.params.pollId ?? "unknown";
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    return `vote:${ip}:${pollId}`;
  },
  validate: false,
});

export const pollCreationRateLimiter = rateLimit({
  windowMs: POLL_CREATION_RATE_LIMIT_WINDOW_MS,
  max: POLL_CREATION_RATE_LIMIT_MAX,
  message: { error: "Too many polls created. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});
