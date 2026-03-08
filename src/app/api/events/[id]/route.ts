import { eventEmitter, EVENTS } from "@/lib/events";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const eventName = EVENTS.LOOT_SESSION_UPDATED(id);

  const stream = new ReadableStream({
    start(controller) {
      const listener = (data: any) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(payload));
      };

      eventEmitter.on(eventName, listener);

      // Keep connection alive with heartbeat every 15s
      const heartbeat = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        eventEmitter.off(eventName, listener);
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
