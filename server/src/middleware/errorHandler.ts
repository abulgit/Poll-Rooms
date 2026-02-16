import type { Request, Response, NextFunction } from "express";
import { NODE_ENV } from "../lib/constants";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[Error] ${err.message}`, NODE_ENV === "development" ? err.stack : "");

  res.status(500).json({
    error: "Internal server error",
    ...(NODE_ENV === "development" && { details: err.message }),
  });
}
