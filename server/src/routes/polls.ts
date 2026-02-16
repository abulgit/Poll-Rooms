import { Router } from "express";
import { createPoll, getPollById } from "../services/pollService";
import { validate, validateParams, createPollSchema, pollIdParamSchema } from "../middleware/validator";
import { pollCreationRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// POST /api/polls - Create a new poll
router.post("/", pollCreationRateLimiter, validate(createPollSchema), async (req, res, next) => {
  try {
    const { question, options } = req.body as { question: string; options: string[] };
    const creatorIp = req.ip;

    const { pollId } = await createPoll(question, options, creatorIp);

    const shareUrl = `${req.protocol}://${req.get("host")}/poll/${pollId}`;

    res.status(201).json({ pollId, shareUrl });
  } catch (err) {
    next(err);
  }
});

// GET /api/polls/:pollId - Get poll with results
router.get("/:pollId", validateParams(pollIdParamSchema), async (req, res, next) => {
  try {
    const pollId = req.params.pollId as string;
    const poll = await getPollById(pollId);

    if (!poll) {
      res.status(404).json({ error: "Poll not found" });
      return;
    }

    res.json(poll);
  } catch (err) {
    next(err);
  }
});

export default router;
