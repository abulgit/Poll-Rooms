import type { Response } from "express";
import type { PollResults } from "@/types";

class SSEManager {
  private connections: Map<string, Set<Response>> = new Map();

  addConnection(pollId: string, res: Response): void {
    if (!this.connections.has(pollId)) {
      this.connections.set(pollId, new Set());
    }
    this.connections.get(pollId)!.add(res);
  }

  removeConnection(pollId: string, res: Response): void {
    const pollConnections = this.connections.get(pollId);
    if (!pollConnections) return;

    pollConnections.delete(res);

    if (pollConnections.size === 0) {
      this.connections.delete(pollId);
    }
  }

  broadcast(pollId: string, data: PollResults): void {
    const pollConnections = this.connections.get(pollId);
    if (!pollConnections) return;

    const message = JSON.stringify({ type: "update", data });

    for (const res of pollConnections) {
      res.write(`data: ${message}\n\n`);
    }
  }

  getConnectionCount(pollId: string): number {
    return this.connections.get(pollId)?.size ?? 0;
  }
}

export const sseManager = new SSEManager();
