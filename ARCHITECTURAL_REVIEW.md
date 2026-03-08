# 🛡️ Nexus Architectural Review & Hardening Plan

This document outlines the identified refactoring, optimization, and security opportunities for the SC Org Loot Vault platform. These recommendations focus on maintaining a high-performance, modular, and secure multi-tenant environment.

---

## 1. 🛡️ Security & Data Integrity

### **A. Input Validation Hardening (Zod Expansion)**
*   **Observation:** While standard user and organization actions use Zod, high-stakes actions like `createLootSession`, `claimLootSessionItem`, and `startGlobalSpin` rely on manual checks.
*   **Plan:** Implement comprehensive Zod schemas for all remaining Server Actions to prevent malformed data injections or edge-case crashes.

### **B. Field-Level Redaction (API Security)**
*   **Observation:** Most API routes correctly use Prisma's `select` to limit fields. However, we should ensure that sensitive fields (password hashes, Discord tokens) are NEVER part of the initial fetch, rather than unsetting them after the fact.
*   **Plan:** Perform a sweep of all `src/app/api` routes to enforce strict `select` masks on all User and Organization queries.

### **C. Atomic Transaction Hardening**
*   **Observation:** `finalizeGlobalSession` performs multiple vault updates inside a loop. While functional, it is vulnerable to performance degradation during large-scale distributions.
*   **Plan:** Refactor batch vault updates to use more efficient Prisma batching logic to ensure database atomicity and speed.

---

## 2. ⚡ Optimization & Performance

### **D. Real-Time HUD Efficiency (Polling Optimization)**
*   **Observation:** Both the Dispatch Lobby and Priority Alerts use a 3-second polling interval. This is effective but can create unnecessary database load as the network scales.
*   **Plan:** Implement a "Smart Polling" protocol where the frequency decreases if the session is idle or if the user is inactive, reducing overhead.

### **E. Database Indexing**
*   **Observation:** As the `DistributionLog` and `LootItem` tables grow, queries filtering by `orgId` and `type` will slow down.
*   **Plan:** Add database indexes to frequently filtered columns in `prisma/schema.prisma` to maintain sub-millisecond response times.

---

## 3. 🏗️ Refactoring for Maintainability

### **F. Component De-Monolithization**
*   **Observation:** `src/app/dispatch/[id]/page.tsx` now contains both the lobby logic and the complex `MasterRNGWheel` sub-component.
*   **Plan:** Extract the `MasterRNGWheel` and the `SequenceManifest` into their own files in `src/components/distributions` to keep the page logic clean.

### **G. Shared Types Manifest**
*   **Observation:** Custom types (e.g., `LootSession`, `Participant`) are being defined inline in multiple components.
*   **Plan:** Centralize all domain-specific TypeScript interfaces into `src/lib/types.ts` to ensure type consistency across the frontend and backend.

---

## 🚀 Proposed Implementation Sequence

1.  **Phase 1 (Security):** Hardening all remaining server actions with Zod schemas.
2.  **Phase 2 (Modularity):** Extracting the RNG Wheel and Manifest components into separate modules.
3.  **Phase 3 (Optimization):** Indexing the database and refining the polling pulse.

---

*Authored by SC Loot Vault Engineering // 2956*
