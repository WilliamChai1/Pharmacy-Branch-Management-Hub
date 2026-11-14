---
name: pmg-monthly-presentation
description: Build and update the PMG Pharmacy Kota Sentosa (KS01) Monthly HQ Presentation (.pptx) from Google Cloud synced performance datasets, 3-month teammate trends, 6-month stock aging plans, and 5S audit reports using Python scripts or the PMG Hub Webapp.
---

# PMG Monthly HQ Presentation Runbook

Use this skill when William asks to generate or update the monthly HQ management presentation slide deck (`Kota_Sentosa_<Month>_<Year>_Official.pptx`), either directly from an Antigravity Cloud folder/Drive dataset or from the PMG Hub Webapp (`performance/performance.js`).

## Recommended Cloud vs Webapp Workflow
- **Webapp (`performance/index.html`)**: Best for quick interactive browser previews (`Download Official Presentation (.pptx)`), uploading new CSV/Excel exports (`Upload CSV & Data Studio`), and updating live SKU 6-month aging action plans across PCs.
- **Antigravity Cloud / Python Script (`scripts/generate_monthly_deck.py`)**: Best for bespoke executive slide formatting, injecting fresh Google Cloud (`KS01_PERF_META` / `getApplicantDoc`) & 5S walkthrough audit data, and producing a multi-slide PowerPoint deck using `templates/pmg_monthly_presentation_template.pptx`.

## Data Gathering Rules
1. Never hardcode static numbers or carry over stale template figures across months.
2. Pull the latest non-patient operational metrics from:
   - `KS01_PERF_META` + chunked datasets via `PMG_SCHEDULE_API_URL` (`getStaffPreferences&branch=KS01_PERF_META`, `getApplicantDoc`)
   - Rolling 3-month teammate personal sales + GP% + House Brand contribution
   - `KS01_PERF_ACTION_PLANS` (latest saved 6-month aging clearance actions)
   - `PMG_OPS_MISC_VAULT_KS01` -> `auditWalkthrough` (5S store walkthrough score & action items)
3. **PDPA Guardrail**: Do NOT include any patient clinical records, NRICs, or Patient Care biomarkers in HQ decks. Aggregate non-identifying operational counts only if needed.

## Execution Steps
1. Verify dependencies from `requirements.txt` (`python-pptx`, `Pillow`, `openpyxl`, `pandas`).
2. Prepare structured JSON payload matching the `update_presentation(template_path, data, output_path)` contract in `scripts/generate_monthly_deck.py` without modifying unrelated template masters.
3. Run `python scripts/generate_monthly_deck.py` (or pass custom parsed JSON via a wrapper script that invokes `update_presentation`).
4. Validate generated slide text, KPI reconciliation, and category totals before sharing.
