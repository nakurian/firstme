"use client";

import { useEffect, useRef, useState } from "react";
import type { ProgressEvent } from "@/lib/types/analysis";

interface ProgressStreamProps {
  analysisId: string;
  streamUrl?: string;
  onComplete?: () => void;
}

export default function ProgressStream({
  analysisId,
  streamUrl,
  onComplete,
}: ProgressStreamProps) {
  const [messages, setMessages] = useState<ProgressEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = streamUrl ?? `/api/analyses/${analysisId}/stream`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);

        if (data.type === "result") {
          eventSource.close();
          onComplete?.();
        }

        if (data.type === "error") {
          setError(data.message ?? "An unknown error occurred");
          eventSource.close();
        }
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      setError("Connection to stream lost");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [analysisId, streamUrl, onComplete]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
        <span className="text-sm font-medium text-gray-300">
          Analysis in progress...
        </span>
      </div>

      <div
        ref={logRef}
        className="max-h-80 overflow-y-auto p-4 font-mono text-sm"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`py-0.5 ${
              msg.type === "error"
                ? "text-red-400"
                : msg.type === "result"
                  ? "text-green-400"
                  : "text-gray-400"
            }`}
          >
            <span className="mr-2 text-gray-600">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
            {msg.message}
          </div>
        ))}

        {messages.length === 0 && !error && (
          <div className="text-gray-500">Waiting for events...</div>
        )}
      </div>

      {error && (
        <div className="border-t border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
