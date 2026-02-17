import type { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import {
  MIN_QUESTION_LENGTH,
  MAX_QUESTION_LENGTH,
  MIN_OPTIONS_PER_POLL,
  MAX_OPTIONS_PER_POLL,
  MIN_OPTION_LENGTH,
  MAX_OPTION_LENGTH,
  FINGERPRINT_MIN_LENGTH,
  FINGERPRINT_MAX_LENGTH,
} from "@/lib/constants";

export const createPollSchema = z.object({
  question: z
    .string()
    .min(MIN_QUESTION_LENGTH, `Question must be at least ${MIN_QUESTION_LENGTH} characters`)
    .max(MAX_QUESTION_LENGTH, `Question must be at most ${MAX_QUESTION_LENGTH} characters`)
    .transform((s) => s.trim()),
  options: z
    .array(
      z
        .string()
        .min(MIN_OPTION_LENGTH, `Option must be at least ${MIN_OPTION_LENGTH} character`)
        .max(MAX_OPTION_LENGTH, `Option must be at most ${MAX_OPTION_LENGTH} characters`)
        .transform((s) => s.trim())
    )
    .min(MIN_OPTIONS_PER_POLL, `At least ${MIN_OPTIONS_PER_POLL} options required`)
    .max(MAX_OPTIONS_PER_POLL, `At most ${MAX_OPTIONS_PER_POLL} options allowed`),
});

export const voteSchema = z.object({
  optionId: z.uuid("Invalid option ID format"),
  fingerprint: z
    .string()
    .min(FINGERPRINT_MIN_LENGTH, "Invalid fingerprint")
    .max(FINGERPRINT_MAX_LENGTH, "Invalid fingerprint")
    .regex(/^[a-zA-Z0-9]+$/, "Fingerprint must be alphanumeric"),
});

export const pollIdParamSchema = z.object({
  pollId: z.uuid("Invalid poll ID format"),
});

export function validate<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: z.prettifyError(result.error),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateParams<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        error: "Invalid parameters",
        details: z.prettifyError(result.error),
      });
      return;
    }
    next();
  };
}
