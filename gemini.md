# 🤖 Nexus System Manifest: Gemini Agent Protocol

This document provides the essential operational context, architectural blueprints, and engineering standards for Gemini agents working on the **SC Org Loot Vault (Nexus Platform)**.

> [!IMPORTANT]
> This manifest is a **living document**. It must be updated constantly as the system evolves, refactoring occurs, or new lessons are learned. Additionally, if the user explicitly says **"remember this"** after a task, the relevant insight or instruction should be integrated here immediately.

---

## 🏗️ 1. Architecture Overview

- **Core Framework:** [Next.js 16+](https://next.js.org/) (App Router)
- **Database / ORM:** [Prisma](https://www.prisma.io/) with PostgreSQL.
- **Security Logic:** Centralized in `src/lib/auth-checks.ts`. Always use `requireAuth`, `requireAdmin`, or `requireSuperAdmin` in Server Actions.
- **Shared Types:** Centralized in `src/lib/types.ts`. Use these interfaces instead of `any` or inline definitions for domain models.
- **State Management:** 
    - **Server:** Server Actions (`src/app/actions/*`) for all mutations.
    - **Client:** React Hooks (`useState`, `useMemo`) + **Smart Polling** (2s - 15s interval) for real-time HUD elements.
- **Validation:** [Zod](https://zod.dev/) schemas in `src/lib/validations.ts` MUST be used to parse all incoming action data.

---

## 🚀 2. Core Platform Features

### **A. Synchronized Real-Time Dispatch (Loot Sessions)**
- **Mechanic:** RNG-based distribution using "Reel" or "Wheel" animations.
- **Synchronicity:** Achievements are synchronized via `animationState` (JSON) in the `LootSession` model.
- **Deterministic RNG:** Uses `seededRandom(seed)` from `src/lib/utils.ts`.
- **Modularity:** Dispatch UI is decomposed into `MasterRNGWheel`, `SessionManifest`, `WinnerHUD`, and `CommandControls` in `src/components/distributions`.
- **Smart Polling:** HUDs dynamically throttle background polling (e.g., from 2s to 10s+) when the browser tab is hidden using the `visibilitychange` event listener.

### **B. Discord Integration (Manifest Bridge)**
- **Bot Location:** `scripts/run-bot.ts`.
- **Commands:** `/link-account`, `/my-assets`, `/request-asset`, `/vault-status`, `/loot-search`.
- **Linking:** Ties Discord `snowflake` IDs to Vault `CUID` user records.
- **Heartbeat:** Bot updates `discordBotLastSeen` in the `Org` table every 30s to indicate health.

### **C. Alliance & Diplomacy System**
- **Handshake:** Bi-directional alliance entries in the `Alliance` table.
- **Requests:** `AllianceRequest` handles the "Pending" state between organizations.
- **Overrides:** Superadmins can force alliances or deletions via `adminCreateAlliance` and `adminDeleteAlliance`.

### **D. Manifest Ingestion (Data Import)**
- **Supported:** CSV uploads and Google Sheets links.
- **Heuristics:** `previewGoogleSheet` in `import-sheet.ts` uses column density to automatically detect header rows.
- **Libraries:** Uses `PapaParse` for CSV parsing and `axios` for fetching public sheet exports.

### **E. Whitelabeling & Theming**
- **Dynamic CSS:** `RootLayout` (`src/app/layout.tsx`) injects CSS variables (e.g., `--sc-blue`) into the `<body>` based on the user's `Org` configuration.
- **Components:** Components use these variables for colors to maintain organization branding throughout the HUD.

### **F. Master Manifest (SCItemCache)**
- **Source:** Synced from the Star Citizen Wiki API (`scripts/seed-sc-items.ts`).
- **Function:** Serves as the authoritative source for item names, categories, and images.
- **Categories:** FPS weapons, ship components (shields, power plants), and armor.

---

## 🎨 3. Style & UX Guide (The HUD Aesthetic)

The platform mimics a high-tech Star Citizen "In-Lore" HUD.

- **Color Palette:**
    - Primary: Dark space-navy (`#05050A`)
    - Accent: Neon Cyan (`#00D1FF`)
    - Warnings: Red (`#FF4D4D`)
    - Success: Emerald (`#00FFC2`)
- **Typography:** Geist Sans for UI, Geist Mono for technical/data values.
- **Conventions:**
    - Use **Uppercase** for "Designations" (usernames) and "Asset Classes".
    - HUD elements should use `backdrop-blur-md` and `bg-black/40` for transparency.
    - Borders should typically be `border-sc-blue/20`.

---

## ⚡ 4. Critical Engineering Patterns

### **A. Server Action Hardening**
Every action must follow this pattern:
1.  **Parse:** Validate input with Zod.
2.  **Auth:** Check permissions (RBAC).
3.  **Transaction:** Use `prisma.$transaction` for multi-step updates (especially vault logic).
4.  **Audit:** Log the result to `DistributionLog`.
5.  **Revalidate:** Clear the relevant Next.js cache paths.

### **B. Field-Level Redaction (Security First)**
Never use `include` on the `Org` or `User` models without an explicit `select` mask in API routes. **NEVER** expose `discordBotToken`, `googleSheetId`, or `password`.

### **C. Deterministic RNG Protocol**
For synchronized real-time HUDs (like the RNG Wheel), use `seededRandom(seed)` from `src/lib/utils.ts`. This ensures all participants see the same animation result simultaneously.

---

## 🧠 5. Lessons Learned & Edge Cases

- **Transactional Integrity:** In `finalizeGlobalSession`, always decrement the physical vault **before** marking the session complete.
- **Multi-Tenancy:** Always verify `orgId` matches the session user's `orgId` during mutations. Don't rely on UI-side filtering alone.
- **Dangling Revalidations:** When editing actions, ensure `revalidatePath` calls are within the `try` block but after the database transaction has successfully committed.
- **Zod CUIDs:** Most IDs in this system are CUIDs. Use `.cuid()` in Zod schemas for IDs.

---

## 🛠️ 6. Tooling & Verification

- **Tests:** `npm test` runs the Vitest suite. Always add tests for new logic in `*.test.ts`.
- **Linting:** `npm run lint` is strict. Avoid `any` types where possible, though the project currently has several legacy `any` usages in complex UI components.
- **Database:** `npx prisma studio` to inspect local telemetry.

---

*Operational Date: 2956.03.08 // NEXUS-OS V1.0*
