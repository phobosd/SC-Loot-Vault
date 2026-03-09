import { z } from "zod";
import { Role } from "@prisma/client";

// User Schemas
export const createUserSchema = z.object({
  username: z.string().min(3).max(30).optional().nullable(),
  password: z.string().min(8).max(100).optional().nullable(),
  email: z.string().email().or(z.literal("")).optional().nullable(),
  name: z.string().min(2).max(50).optional().nullable(),
  role: z.nativeEnum(Role),
  orgId: z.string().cuid(),
});

export const updateUserSchema = z.object({
  email: z.string().email().or(z.literal("")).optional().nullable(),
  name: z.string().min(2).max(50).optional().nullable(),
  role: z.nativeEnum(Role),
  password: z.string().min(8).max(100).optional().nullable(),
  orgId: z.string().cuid().optional(),
  username: z.string().min(3).max(30).optional().nullable(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

// Org Schemas
export const provisionOrgSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/),
  requesterName: z.string().min(2).max(50),
  adminPassword: z.string().min(8).max(100).optional().nullable(),
  contactInfo: z.string().min(2).max(100),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// Loot Schemas
export const addLootItemsSchema = z.array(z.object({
  orgId: z.string().cuid(),
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  subCategory: z.string().max(50).optional().nullable(),
  quantity: z.number().int().positive(),
  size: z.string().max(20).optional().nullable(),
  grade: z.string().max(20).optional().nullable(),
  class: z.string().max(50).optional().nullable(),
  manufacturer: z.string().max(50).optional().nullable(),
}));

// Distribution Schemas
export const createLootSessionSchema = z.object({
  orgId: z.string().max(100), // Could be "GLOBAL" or CUID
  title: z.string().min(3).max(100),
  itemIds: z.array(z.string().cuid()).min(1),
  participantIds: z.array(z.string().cuid()).min(1),
  type: z.enum(["REEL", "WHEEL"]).optional(),
  mode: z.enum(["OPERATORS", "ITEMS"]).optional(),
});

export const assignItemToOperatorSchema = z.object({
  orgId: z.string().cuid(),
  recipientId: z.string().cuid(),
  lootItemId: z.string().cuid(),
  itemName: z.string().min(1).max(100),
  quantity: z.number().int().positive(),
  performedBy: z.string().optional(),
});

export const recordDistributionSchema = z.object({
  orgId: z.string().cuid(),
  recipientId: z.string().cuid().nullable().optional(),
  itemName: z.string().min(1).max(100),
  quantity: z.number().int().positive(),
  type: z.string().min(1).max(50),
  method: z.string().min(1).max(50),
  performedBy: z.string().optional(),
  lootItemId: z.string().cuid().optional(),
});

export const startGlobalSpinSchema = z.object({
  sessionId: z.string().cuid(),
});

export const finalizeGlobalSessionSchema = z.object({
  sessionId: z.string().cuid(),
});

export const resetGlobalSessionSchema = z.object({
  sessionId: z.string().cuid(),
});

export const archiveGlobalSessionSchema = z.object({
  sessionId: z.string().cuid(),
});

// Alliance Schemas
export const allianceOverrideSchema = z.object({
  org1Id: z.string().cuid(),
  org2Id: z.string().cuid(),
});

// More Loot Schemas
export const removeLootItemsSchema = z.object({
  itemIds: z.array(z.string().cuid()).min(1),
});

export const updateLootItemSchema = z.object({
  itemId: z.string().cuid(),
  quantity: z.number().int().nonnegative(),
});

export const wipeLootManifestSchema = z.object({
  orgId: z.string().cuid(),
});

export const createLootRequestSchema = z.object({
  orgId: z.string().cuid(),
  userId: z.string().cuid(),
  itemId: z.string().cuid(),
  itemName: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  quantity: z.number().int().positive(),
  targetOrgId: z.string().cuid().nullable().optional(),
});

export const approveLootRequestSchema = z.object({
  requestId: z.string().cuid(),
  adminId: z.string().cuid(),
});

export const rejectLootRequestSchema = z.object({
  requestId: z.string().cuid(),
  reason: z.string().min(1).max(500),
});

// More User Schemas
export const updateUserRoleSchema = z.object({
  userId: z.string().cuid(),
  role: z.nativeEnum(Role),
});

export const deleteUserSchema = z.object({
  userId: z.string().cuid(),
});

// More Org Schemas
export const updateOrgSchema = z.object({
  orgId: z.string().cuid(),
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const deleteOrgSchema = z.object({
  orgId: z.string().cuid(),
});

export const updateOrgDiscordSchema = z.object({
  orgId: z.string().cuid(),
  discordBotToken: z.string().max(200).optional().nullable(),
  discordGuildId: z.string().max(100).optional().nullable(),
});

export const updateOrgSettingsSchema = z.object({
  orgId: z.string().cuid(),
  name: z.string().min(2).max(50),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  successColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  dangerColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  logoUrl: z.string().url().or(z.literal("")).nullable().optional(),
  headerText: z.string().max(100).nullable().optional(),
  footerText: z.string().max(100).nullable().optional(),
});

export const submitOrgRequestSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/),
  requesterName: z.string().min(2).max(50),
  adminPassword: z.string().min(8).max(100).optional().nullable(),
  contactInfo: z.string().min(2).max(100),
});

export const approveOrgRequestSchema = z.object({
  requestId: z.string().cuid(),
});

export const rejectOrgRequestSchema = z.object({
  requestId: z.string().cuid(),
});

// API Key Schemas
export const createApiKeySchema = z.object({
  orgId: z.string().cuid(),
  name: z.string().min(2).max(50),
});

export const deleteApiKeySchema = z.object({
  keyId: z.string().cuid(),
});

