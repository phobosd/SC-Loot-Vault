# 📡 Nexus Platform API Documentation

Welcome to the **SC Org Loot Vault (Nexus Platform)** API documentation. This document outlines how to integrate external tools, recruitment sites, and custom HUDs with the organization vault.

---

## 🔑 Authentication

All external API requests must be authenticated using an **API Uplink Key**.

1.  **Generate a Key:** Go to **Settings > API Uplink Management** in your dashboard.
2.  **Usage:** Include the key in your request headers as `X-Nexus-Key`.

```bash
curl -H "X-Nexus-Key: nx_your_secure_key_here" https://loot.nexus.network/api/org-inventory
```

---

## 🛰️ API Endpoints

### **1. Vault Inventory**
Fetch the current real-time manifest of your organization's vault.

*   **Endpoint:** `GET /api/org-inventory`
*   **Query Parameters:**
    *   `q` (optional): Fuzzy search query (min 2 characters).
*   **Response:** Array of item objects.

```json
[
  {
    "id": "cmmghvk0o000lhk3wyx8xka8s",
    "name": "FS-9 LMG",
    "category": "FPS.Weapon",
    "quantity": 12,
    "manufacturer": "Behring"
  }
]
```

---

### **2. Add Assets**
Inject new items into the vault manifest from external logistics tools or scrapers.

*   **Endpoint:** `POST /api/org-inventory`
*   **Body:** Object or Array of items.
*   **Fields:**
    *   `name` (required): Designation of the asset.
    *   `category` (required): Item classification.
    *   `quantity` (required): Integer.
    *   `manufacturer` (optional): Maker of the item.
*   **Protocol:** The system will automatically attempt to fuzzy-match items against the Master Manifest to enrich missing metadata.

```json
{
  "name": "CF-337 Panther",
  "category": "Ship.Weapon",
  "quantity": 5
}
```

---

### **3. Distribution Ledger**
Retrieve the history of recently assigned assets.

*   **Endpoint:** `GET /api/assignments`
*   **Response:** Object containing `assignments` array and `orgName`.

---

### **4. Master Manifest Search**
Utility to query the global SC item database with fuzzy matching.

*   **Endpoint:** `GET /api/sc-items/search`
*   **Query Parameters:**
    *   `q`: Search query.
*   **Response:** Top 10 fuzzy matches from the Wiki cache.

---

### **5. Real-Time Event Stream (SSE)**
Listen to live dispatch events as they occur.

*   **Endpoint:** `GET /api/events/[sessionId]`
*   **Type:** Server-Sent Events (SSE).
*   **Events:** `SESSION_STARTED`, `SESSION_RESET`, `SESSION_FINALIZED`.

---

## 🛡️ Security & Rate Limiting

- **Scope:** API keys are scoped to your organization. They cannot access data from allied or external orgs unless explicitly authorized.
- **Exposure:** Masked keys are stored in the database. If a key is leaked, decommission it immediately from the Settings dashboard.
- **CORS:** All endpoints support cross-origin requests.

---

*Last Updated: 2956.03.08 // NEXUS-API V1.1*
