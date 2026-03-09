import { eventEmitter, EVENTS } from "@/lib/events";
import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // 1. Authorization Check
  let isAuthorized = false;
  try {
    const orgId = await validateApiKey();
    const session = await prisma.lootSession.findUnique({
      where: { id },
      select: { orgId: true }
    });

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    if (orgId) {
      // API Key Auth: Key must belong to the org that owns the session
      if (session.orgId === orgId || !session.orgId) isAuthorized = true;
    } else {
      // Cookie Auth
      const userSession: any = await getServerSession(authOptions);
      if (userSession?.user) {
        if (userSession.user.orgId === session.orgId || !session.orgId || userSession.user.role === 'SUPERADMIN') {
          isAuthorized = true;
        }
      }
    }
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
