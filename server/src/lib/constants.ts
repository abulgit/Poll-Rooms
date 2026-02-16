export const MAX_OPTIONS_PER_POLL = 10;
export const MIN_OPTIONS_PER_POLL = 2;

export const MAX_QUESTION_LENGTH = 500;
export const MIN_QUESTION_LENGTH = 10;

export const MAX_OPTION_LENGTH = 200;
export const MIN_OPTION_LENGTH = 1;

export const FINGERPRINT_MIN_LENGTH = 32;
export const FINGERPRINT_MAX_LENGTH = 64;

export const VOTE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const VOTE_RATE_LIMIT_MAX = 3; // 3 votes per IP per hour

export const POLL_CREATION_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
export const POLL_CREATION_RATE_LIMIT_MAX = 10; // 10 polls per IP per day

export const PORT = Number(process.env.PORT) || 3000;
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
export const NODE_ENV = process.env.NODE_ENV || "development";
