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
