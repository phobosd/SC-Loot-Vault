import { Role } from "@prisma/client";

export interface User {
  id?: string;
  username?: string | null;
  name: string | null;
  email?: string | null;
  discordId?: string | null;
  role?: Role;
  status?: string;
  image?: string | null;
  orgId?: string | null;
  org?: Org | null;
  isImpersonating?: boolean;
}

export interface Org {
  id?: string;
  name: string;
  slug?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  accentColor?: string;
  whitelabelConfig?: {
    footerText?: string | null;
    headerText?: string | null;
  } | null;
}

export interface LootItem {
  id: string;
  orgId: string;
  name: string;
  category: string;
  subCategory: string | null;
  quantity: number;
  size: string | null;
  class: string | null;
  grade: string | null;
  manufacturer: string | null;
  description?: string | null;
  wikiId?: string | null;
  type?: string | null;
  subType?: string | null;
  isOrgItem?: boolean;
}

export interface LootSession {
  id: string;
  orgId: string | null;
  title: string;
  status: string; // ACTIVE, SPINNING, COMPLETED, ARCHIVED
  type: string;   // REEL, WHEEL
  mode: string;   // OPERATORS, ITEMS
  animationState?: string | null;
  currentWinnerId?: string | null;
  items?: LootSessionItem[];
  participants?: LootSessionParticipant[];
}

export interface LootSessionItem {
  id: string;
  sessionId: string;
  itemId: string;
  name: string;
  category: string;
  imageUrl: string | null;
  rarity: string;
}

export interface LootSessionParticipant {
  id: string;
  sessionId: string;
  userId: string;
  user?: User;
  wonItemName: string | null;
}

export interface ApiKey {
  id: string;
  orgId: string;
  key: string;
  name: string;
  createdAt: Date;
  lastUsed: Date | null;
}
