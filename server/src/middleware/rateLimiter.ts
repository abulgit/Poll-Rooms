// TODO: Re-enable rate limiting for production
// Rate limiting is disabled during development for easier testing.

// import rateLimit from "express-rate-limit";
// import {
//   VOTE_RATE_LIMIT_WINDOW_MS,
//   VOTE_RATE_LIMIT_MAX,
//   POLL_CREATION_RATE_LIMIT_WINDOW_MS,
//   POLL_CREATION_RATE_LIMIT_MAX,
// } from "../lib/constants";

import type { RequestHandler } from "express";

// Passthrough middleware (no-op) for development
const passthrough: RequestHandler = (_req, _res, next) => next();

export const voteRateLimiter = passthrough;
export const pollCreationRateLimiter = passthrough;
