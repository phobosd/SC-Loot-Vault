# 🚀 SC Org Loot Vault

An immersive, high-tech Star Citizen Organization Loot Vault Manager. This platform allows Orgs to track, manage, and distribute loot (Ship Components, Weapons, and Armor) with a Star Citizen-inspired HUD aesthetic. Cloud-native architecture hosted on **Firebase App Hosting** and backed by **Neon PostgreSQL**.

![License](https://img.shields.io/badge/Clearance-Level_9-blue?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![Database](https://img.shields.io/badge/Database-PostgreSQL/Neon-blue?style=flat-square)
![Theme](https://img.shields.io/badge/Theme-Dynamic_HUD-00D1FF?style=flat-square)

---

## 🛠 Technology Stack

- **Framework:** Next.js 16 (App Router / Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + `tailwindcss-animate`
- **Database:** Prisma ORM with **Neon PostgreSQL** (Serverless)
- **Hosting:** **Firebase App Hosting** (Cloud Run based)
- **Authentication:** NextAuth.js v4 (Credentials & Discord OAuth)
- **API Integration:** Star Citizen Wiki API (Automatic Telemetry)
- **Real-time:** Server Actions, Revalidation, and Dynamic Polling
- **Validation:** Zod (Type-safe input validation)

---

## ✨ Core Features

### 📦 Intelligent Manifest Import
- **Dual-Method Bridge:** Import via **Google Sheets Link** (auto GID extraction) or **Local CSV Upload**.
- **Protocol Mapping:** Interactive interface to align your custom spreadsheet columns to the platform schema.
- **Smart Detection:** Automatically skips instructional noise and empty rows to find the correct header data.
- **Live Preview:** Verify parsed records before committing to the persistent organization manifest.

### 🤝 Alliance Network (Joint Ops)
- **Diplomatic Handshakes:** Send and authorize alliance requests between organizations.
- **Mutual Vault Visibility:** Allied orgs can browse each other's manifests in a secure, read-only mode.
- **Cross-Org Requests:** Request specific loot directly from an ally's inventory.
- **Global Command (SuperAdmin):** Direct oversight and manual override of all diplomatic links in the network.

### ❤️ Personnel Wishlist
- **Target Designation:** Search the Galactic Manifest and add items to your personal procurement wishlist.
- **Network Intelligence:** Automatically cross-references your wishlist against your Org Vault and all Allied Vaults.
- **Proximity Alerts:** Visual indicators (Amber/Green) highlight when a wishlisted item is detected in an available manifest.
- **Instant Procurement:** Direct "Request Asset" button appears for items found within the diplomatic network.

### 🎡 Synchronized RNG Dispatch HUD
- **Real-Time Lobby:** Participants join a shared, synchronized lobby for high-stakes loot distributions.
- **Dual Visual Protocols:** Switch between **Operator Wheel** (rotary spin) and **Box Opening** (horizontal reel) interfaces.
- **Seeded Synchronization:** Seeded entropy ensures every participant sees the exact same items and animation result simultaneously.
- **Dual RNG Logic:** 
    - **Winner takes ALL:** Multiple operators on the wheel; winner receives the entire session manifest.
    - **Winner takes 1 ASSET:** Assets on the wheel; recipient receives the specific item landed upon.
- **Command Control:** Admins can trigger global spins, re-spin for next cycles, and finalize distributions to decrement vault quantities automatically.

### 📜 Master Audit Manifest
- **Full Transparency:** Every action (Loot added, Alliances created, Personnel enrollment) is recorded in a permanent audit trail.
- **Global View:** SuperAdmins have a unified, network-wide transaction manifest for total oversight.
- **Local History:** Organizations maintain their own internal logs for accounting and member activity tracking.

### 🛡️ Nexus Security Suite
- **RBAC Enforcement:** Strict Role-Based Access Control (MEMBER, ADMIN, SUPERADMIN).
- **Organization Isolation:** Multi-tenant architecture ensures data is strictly isolated between organization nodes.
- **Input Hardening:** All telemetry inputs are validated via Zod to prevent malformed data injections.

### 📡 Discord Manifest Bridge
- **Advanced Commands:** Supports both Prefix (`!vault`) and Slash (`/`) commands.
- **Account Linking:** Tie Discord IDs to Vault Operator identities via `/link-account`.
- **Remote Commands:** Access `/my-assets`, `/request-asset`, `/vault-status` directly from your comms channel.

### 🛰️ Public API & Integrations
- **API Uplink Keys:** Generate secure keys to authorize external integrations.
- **External Manifest Access:** Power your own recruitment site or org dashboard with live vault data.
- **Real-Time Webhooks:** Listen to live distribution events via SSE.
- **[View Full API Documentation →](API.md)**

---

## 📸 Interface Preview

> **Note:** Captured from the live SC Org Loot Vault interface.

| Command Dashboard | Vault Manifest | RNG Distribution |
| :--- | :--- | :--- |
| ![Dashboard](screenshots/dashboard.png) | ![Vault](screenshots/vault.png) | ![Distribution](screenshots/vault.png) |

| Alliance Network | Personnel Hub | Admin Settings |
| :--- | :--- | :--- |
| ![Alliance](screenshots/nexus.png) | ![Personnel](screenshots/personnel.png) | ![Settings](screenshots/nexus.png) |

---

## 🚀 Local Installation

### 1. Clone the Repository
```bash
git clone https://github.com/phobosd/SC-Loot-Vault.git
cd sc-loot-vault
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@hostname/dbname?sslmode=require"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Clearances
DISCORD_CLIENT_ID="your-id"
DISCORD_CLIENT_SECRET="your-secret"
```

### 4. Initialize Database & Cache
```bash
npx prisma generate
npx prisma db push
npx ts-node scripts/seed-initial-org.ts
npx ts-node scripts/seed-sc-items.ts
```

### 5. Start Development Server
```bash
npm run dev
```

---

## 🔗 Deployment

This platform is optimized for **Firebase App Hosting**. 

1. **Connect Repository:** Link your GitHub repo in the Firebase Console under App Hosting.
2. **Configure Secrets:** Set `DATABASE_URL_SECRET` and `NEXTAUTH_SECRET_SECRET` in Google Cloud Secret Manager.
3. **Automatic Build:** Every push to the `main` branch triggers an automated build and rollout to your production domain (e.g., `sc-vault.network`).

---

## 📜 Technical Protocol

- **Node Version:** 20.x+
- **Database Engine:** PostgreSQL (Neon)
- **Styling:** Tailwind CSS 4.0
- **Validation:** Zod
- **Data Source:** [Star Citizen Wiki API](https://api.star-citizen.wiki/)

---

Developed by **SC Loot Vault Engineering** // 2956
