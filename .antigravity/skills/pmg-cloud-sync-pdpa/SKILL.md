---
name: pmg-cloud-sync-pdpa
description: Hybrid Antigravity Google Cloud architecture with strict PDPA isolation keeping Patient Care clinical records local/OneDrive-only while syncing all non-patient PMG modules across PCs.
---

# PMG Hybrid Google Cloud & PDPA Isolation Skill

Use this skill whenever adding, debugging, or auditing sync logic in PMG Management Hub.

## Architectural Split
| Data Category | Permitted Storage / Sync | Prohibited Destinations | Guard Mechanism |
| :--- | :--- | :--- | :--- |
| **Patient Medical Data** (`js/patient.js`, `patient/index.html`, `js/db.js`) — encounters, vitals, POCT panels, medications, conditions, allergies, NRIC (`ic`/`patientIc`), clinical files | Browser `localStorage` / `IndexedDB` + Linked **Company OneDrive** (`js/onedrive-sync.js`) | Google Sheets, Google Drive, Apps Script (`PMG_SCHEDULE_API_URL`), Git repo | `window.PMG_PDPA_MEDICAL_CLOUD_GUARD = true`, `PMG_PDPA_FORBIDDEN_CLOUD_FIELDS`, `sanitizePayloadForGoogleCloud()` |
| **Operational Customer Booking & Rentals** (`js/patient.js` -> `pushBookingToCloud`, `pushRentalsToCloud`) | `PMG_SCHEDULE_API_URL` (sanitized non-clinical slots & equipment logs; NRIC stripped) | Raw patient medical payloads | `sanitizePayloadForGoogleCloud()` |
| **Performance & 6M Aging Action Plans** (`performance/performance.js`) | Google Cloud (`KS01_PERF_META`, `KS01_PERF_ACTION_PLANS`, `uploadApplicantDoc` / `getApplicantDoc`) | Hardcoded static overrides | `syncPerformanceWithCloud()`, `syncSkuActionPlansWithCloud()` |
| **Promo Broadcast** (`js/promo-broadcast.js`, `promo/promo.js`) | Google Cloud (`PMG_PROMO_BROADCAST_VAULT_KS01`) + optional OneDrive | OneDrive-only lockouts | `syncPromoBroadcastWithGoogleCloud()` |
| **Smart Inventory Config** (`js/inventory.js`) | Google Cloud (`PMG_INVENTORY_REPLENISHMENT_VAULT_KS01`) | Local-only parameter drift | `syncInventoryConfigWithGoogleCloud()` |
| **5S Audit & Commercial Admin** (`js/onedrive-sync.js`) | Google Cloud (`PMG_OPS_MISC_VAULT_KS01`) | Patient medical fields | `syncAuditFromCloud()`, `syncCommercialFromCloud()` |
| **Schedule, Stock Expiry, Returns/CN, Pricing, Recruitment** | `PMG_SCHEDULE_API_URL` / `PMG_EXPIRY_API_URL` | Hardcoded local paths | `triggerGoogleCloudEcosystemSync()` |

## Verification Checklist
1. Run `npm test` (`node scripts/verify_cloud_pdpa_suite.js`) after any sync or PDPA change.
2. Confirm `PMG_PDPA_FORBIDDEN_CLOUD_FIELDS` are stripped cleanly by `sanitizePayloadForGoogleCloud()`.
3. Confirm `scripts/google_sheets_sync.js` resolves `googleapis` and credentials dynamically via env vars (`PMG_GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_APPLICATION_CREDENTIALS`) with zero secrets committed to git.
