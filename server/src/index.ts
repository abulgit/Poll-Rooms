import express from "express";
import cors from "cors";
import helmet from "helmet";
import { PORT, CORS_ORIGIN, NODE_ENV } from "@/lib/constants";
import { errorHandler } from "@/middleware/errorHandler";
import pollRoutes from "@/routes/polls";
import voteRoutes from "@/routes/votes";
import streamRoutes from "@/routes/stream";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

// Body parsing
app.use(express.json());

// Trust proxy for accurate IP detection (needed behind reverse proxy)
app.set("trust proxy", 1);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/polls", pollRoutes);
app.use("/api/polls", voteRoutes);
app.use("/api/polls", streamRoutes);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} [${NODE_ENV}]`);
});

export default app;
