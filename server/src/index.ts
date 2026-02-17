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

// Body parsing — 10KB limit (polls and votes are tiny payloads)
app.use(express.json({ limit: "10kb" }));

// Trust proxy only in production where Nginx/Azure LB sits in front.
// "loopback" only trusts X-Forwarded-For from 127.0.0.1/::1,
// preventing clients from spoofing their IP to bypass rate limiting.
if (NODE_ENV === "production") {
  app.set("trust proxy", "loopback");
}

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
