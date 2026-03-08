import { EventEmitter } from "events";

// Simple in-memory event emitter for SSE
// NOTE: In a multi-process or serverless environment, this should be replaced with Redis Pub/Sub
class NexusEventEmitter extends EventEmitter {}

// Global singleton to ensure it persists across hot-reloads in development
const globalForEvents = global as unknown as { eventEmitter: NexusEventEmitter };

export const eventEmitter = globalForEvents.eventEmitter || new NexusEventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalForEvents.eventEmitter = eventEmitter;
}

export const EVENTS = {
  LOOT_SESSION_UPDATED: (sessionId: string) => `session:${sessionId}:updated`,
  ORG_INVENTORY_UPDATED: (orgId: string) => `org:${orgId}:inventory:updated`,
};
