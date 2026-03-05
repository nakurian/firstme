import { NextRequest } from "next/server";
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { analyses, analysisEvents } from "@/lib/db/schema";
import { createSubscriber } from "@/lib/queue/connection";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const db = getDb();
  const analysis = db
    .select()
    .from(analyses)
    .where(eq(analyses.id, id))
    .get();

  if (!analysis) {
    return new Response(JSON.stringify({ error: "Analysis not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const subscriber = createSubscriber();
  const channel = `analysis:${id}`;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(data: string) {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Stream closed
        }
      }

      // Replay existing events
      const existingEvents = db
        .select()
        .from(analysisEvents)
        .where(eq(analysisEvents.analysis_id, id))
        .orderBy(asc(analysisEvents.created_at))
        .all();

      for (const event of existingEvents) {
        send(event.data);

        // If a terminal event was already recorded, close the stream
        const parsed = JSON.parse(event.data);
        if (parsed.type === "result" || parsed.type === "error") {
          controller.close();
          await subscriber.quit();
          return;
        }
      }

      // Subscribe to live events
      subscriber.on("message", (_ch: string, message: string) => {
        send(message);

        try {
          const parsed = JSON.parse(message);
          if (parsed.type === "result" || parsed.type === "error") {
            controller.close();
            subscriber.unsubscribe(channel).then(() => subscriber.quit());
          }
        } catch {
          // Ignore parse errors
        }
      });

      await subscriber.subscribe(channel);
    },
    cancel() {
      subscriber.unsubscribe(channel).then(() => subscriber.quit());
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
