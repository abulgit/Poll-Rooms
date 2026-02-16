import { useState, useEffect, useRef, useCallback } from "react";
import type { PollResults, SSEMessage } from "@/types";
import { createPollStream } from "@/lib/api";

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

export function useRealtimePoll(pollId: string | undefined) {
  const [results, setResults] = useState<PollResults | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const retriesRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!pollId) return;

    const es = createPollStream(pollId);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      retriesRef.current = 0;
    };

    es.onmessage = (event: MessageEvent) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);
        if (message.type === "update") {
          setResults(message.data);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    es.onerror = () => {
      es.close();
      setIsConnected(false);

      if (retriesRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retriesRef.current);
        retriesRef.current += 1;
        setTimeout(connect, delay);
      }
    };
  }, [pollId]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  return { results, isConnected };
}
