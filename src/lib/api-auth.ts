import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * Validates the API key from the request headers.
 * Returns the orgId if valid, otherwise throws an error.
 */
export async function validateApiKey() {
  const headerList = await headers();
  const apiKey = headerList.get("x-nexus-key");

  if (!apiKey) {
    return null;
  }

  const keyRecord = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    select: { orgId: true, id: true },
  });

  if (!keyRecord) {
    throw new Error("Invalid API Key");
  }

  // Update lastUsed in the background
  prisma.apiKey.update({
    where: { id: keyRecord.id },
    data: { lastUsed: new Date() },
  }).catch(err => console.error("Failed to update API key lastUsed:", err));

  return keyRecord.orgId;
}
