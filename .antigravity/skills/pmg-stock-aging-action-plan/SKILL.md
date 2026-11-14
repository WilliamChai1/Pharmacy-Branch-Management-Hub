---
name: pmg-stock-aging-action-plan
description: Reconciles 6-month+ stock aging category totals with filtered SKU tables, recalculates remaining aged RM exposure when action plans are saved, and persists plans across PCs in performance/performance.js.
---

# PMG 6-Month+ Stock Aging & Action Plan Reconciliation Skill

Use this skill when updating stock aging parsing, category cards, SKU filters, or Action Plan persistence in `performance/performance.js`.

## Critical Invariants
1. **Single Source of Truth Across Cards & Table**:
   - The 6-month+ Stock Aging Alert KPI card, each category summary card (e.g., `ELDERLY`, `MOM&BABY`, `PERSONAL`), and the filtered SKU Aging Table must all filter and sum using the **same reconciled dataset** (`agedQty > 0` / >=150 days valuation).
   - Never filter out SKUs from the table that were included in the category card total (or vice versa), unless an action plan explicitly marks a SKU cleared and both card + total deduct it consistently.
2. **Action Plan Persistence & Deduction**:
   - Saved per-SKU action plans (`clearance`, `transfer/RTV`, `bundle`, `write-off`, cleared qty/value, assignee, notes) live in `perfState.skuActionPlans` keyed by normalized SKU code/name.
   - Persist immediately to `localStorage` AND push to Google Cloud (`KS01_PERF_ACTION_PLANS` via `pushSkuActionPlansToCloud`) so edits on the outlet PC appear automatically on the home PC without reverting on page refresh.
   - Preserve existing action plans across minor saves until a brand-new stock aging dataset replaces or resets cleared lines as intended.
3. **Upload Sync Durability**:
   - Uploaded reports must store metadata (`KS01_PERF_META`) + chunked datasets (`uploadApplicantDoc`) to Google Cloud so refreshing the page or opening another PC never falls back to default sample data when newer uploaded cloud data exists.
