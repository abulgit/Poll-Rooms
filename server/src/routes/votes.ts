import { Router } from "express";
import { submitVote } from "../services/voteService";
import { validate, validateParams, voteSchema, pollIdParamSchema } from "../middleware/validator";
import { voteRateLimiter } from "../middleware/rateLimiter";
import { sseManager } from "../lib/sse";

const router = Router();

// POST /api/polls/:pollId/vote - Submit a vote
router.post(
  "/:pollId/vote",
  validateParams(pollIdParamSchema),
  voteRateLimiter,
  validate(voteSchema),
  async (req, res, next) => {
    try {
      const pollId = req.params.pollId as string;
      const { optionId, fingerprint } = req.body as { optionId: string; fingerprint: string };
      const voterIp = req.ip ?? "unknown";

      const result = await submitVote(pollId, optionId, fingerprint, voterIp);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          results: result.results,
        });
        return;
      }

      // Broadcast updated results to all SSE listeners
      if (result.results) {
        sseManager.broadcast(pollId, result.results);
      }

      res.json({ success: true, results: result.results });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
