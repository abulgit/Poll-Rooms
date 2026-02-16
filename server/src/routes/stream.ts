import { Router } from "express";
import { validateParams, pollIdParamSchema } from "../middleware/validator";
import { getPollResults } from "../services/pollService";
import { sseManager } from "../lib/sse";

const router = Router();

// GET /api/polls/:pollId/stream - SSE real-time updates
router.get("/:pollId/stream", validateParams(pollIdParamSchema), async (req, res, next) => {
  try {
    const pollId = req.params.pollId as string;

    // Verify poll exists before opening stream
    const results = await getPollResults(pollId);
    if (!results) {
      res.status(404).json({ error: "Poll not found" });
      return;
    }

    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Send initial data
    const initialMessage = JSON.stringify({ type: "update", data: results });
    res.write(`data: ${initialMessage}\n\n`);

    // Register connection
    sseManager.addConnection(pollId, res);

    // Heartbeat to keep connection alive (every 30s)
    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 30000);

    // Cleanup on disconnect
    req.on("close", () => {
      clearInterval(heartbeat);
      sseManager.removeConnection(pollId, res);
    });
  } catch (err) {
    next(err);
  }
});

export default router;
