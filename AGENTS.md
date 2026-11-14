# PMG Pharmacy Management Hub — Kota Sentosa (KS01)

This repository powers the **PMG Management Hub** hybrid web application and **Antigravity Cloud** agent/workflow suite.

## 1. Strict Hybrid Cloud & PDPA Architecture

To support Antigravity Cloud multi-PC continuity while strictly protecting patient privacy under Malaysia PDPA & healthcare confidentiality:

1. **Patient Care & Clinical Records (`js/patient.js`, `patient/index.html`, `js/db.js`) — LOCAL / COMPANY ONEDRIVE ONLY**
   - Clinical encounters, vitals, POCT panels (Lipid, HbA1c, Uric Acid, Glucose), active medications, chronic conditions, allergies, patient NRIC (`ic` / `patientIc`), and medical PDFs **MUST NEVER** be sent to Google Sheets, Google Drive, or public Google Apps Script endpoints.
   - Protected in runtime by `window.PMG_PDPA_MEDICAL_CLOUD_GUARD = true`, `PMG_PDPA_FORBIDDEN_CLOUD_FIELDS`, and `sanitizePayloadForGoogleCloud()` inside `js/patient.js`.
   - Customer Self-Booking and Equipment Rental syncs to `PMG_SCHEDULE_API_URL` only carry non-clinical operational scheduling/inventory fields (with NRIC stripped).
   - Full patient clinical sync remains strictly local (`localStorage` / `IndexedDB`) + Company OneDrive (`js/onedrive-sync.js`).

2. **Non-Patient Operational Modules — GOOGLE CLOUD ECOSYSTEM SYNC**
   - **Performance & 6-Month Aging Action Plans** (`performance/performance.js`): `KS01_PERF_META`, `KS01_PERF_ACTION_PLANS` + chunked datasets via `uploadApplicantDoc` / `getApplicantDoc`.
   - **Promo Broadcast** (`js/promo-broadcast.js`, `promo/promo.js`): `PMG_PROMO_BROADCAST_VAULT_KS01` (`syncPromoBroadcastWithGoogleCloud`).
   - **Smart Inventory Replenishment** (`js/inventory.js`): `PMG_INVENTORY_REPLENISHMENT_VAULT_KS01` (`syncInventoryConfigWithGoogleCloud`).
   - **5S Audit & Commercial Admin** (`js/onedrive-sync.js`, `js/audit.js`, `js/commercial-admin.js`): `PMG_OPS_MISC_VAULT_KS01` (`syncAuditFromCloud`, `syncCommercialFromCloud`).
   - **Scheduler / Timetable Preferences, Stock Expiry, Returns & CN, Pricing Matrix, Recruitment**: Sync via `PMG_SCHEDULE_API_URL` / `PMG_EXPIRY_API_URL` Apps Script endpoints & `triggerGoogleCloudEcosystemSync`.

## 2. Gemini Model Policy (Current Studio Quota Tier)
Always use active free/current Studio models in client & script code; never reintroduce retired models (`gemini-2.0-flash-lite`, `gemini-2.5-flash`):
- Primary lightweight/grounded search: `gemini-3.5-flash-lite`
- Fallback lightweight: `gemini-3.1-flash-lite`
- Deep strategic synthesis: `gemini-3.8-flash`

## 3. Antigravity Customizations (`.agents/` & `.antigravity/`)
Custom subagents, domain `SKILL.md` skills, and Python orchestration workflows are stored in `.agents/` (and mirrored to `.antigravity/`):
- **Agents**: `file-writer`, `pmg-pricing-analyst`, `pmg-performance-strategist`, `pmg-cloud-pdpa-architect`, `pmg-inventory-replenishment`
- **Skills**: `pmg-monthly-presentation`, `pmg-pricing-intelligence`, `pmg-cloud-sync-pdpa`, `pmg-stock-aging-action-plan`
- **Workflows**: `monthly_hq_report_workflow.py`, `cloud_sync_pdpa_audit_workflow.py`

## 4. Security & Verification Commands
- **Never commit** `.env*`, API keys (`AIza...`), or Google Service Account files (`gen-lang-client-*.json`). Pass credentials at runtime via `PMG_GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`.
- Run verification suite before any push:
  ```bash
  npm test
  ```
