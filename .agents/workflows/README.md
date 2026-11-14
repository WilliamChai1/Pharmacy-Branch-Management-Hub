# PMG Antigravity Agents, Skills & Workflows

This directory is automatically discovered by Antigravity (`.agents/`) and mirrored to `.antigravity/`.

## Directory Structure
- `agents/` — Specialized subagent definitions (`agent.md`):
  - `file-writer` — High-volume production file writer
  - `pmg-pricing-analyst` — Competitor pricing & House Brand SWOT integrity
  - `pmg-performance-strategist` — YoY KPIs, 3M teammate tracking, 6M aging, HQ `.pptx` decks
  - `pmg-cloud-pdpa-architect` — Malaysia PDPA patient medical firewall + Google Cloud sync
  - `pmg-inventory-replenishment` — Smart Inventory POs, Stock Expiry, Returns/CN
- `skills/` — On-demand domain runbooks (`SKILL.md`):
  - `pmg-monthly-presentation`
  - `pmg-pricing-intelligence`
  - `pmg-cloud-sync-pdpa`
  - `pmg-stock-aging-action-plan`
- `workflows/` — Executable Antigravity `run_workflow` Python orchestration scripts:
  - `monthly_hq_report_workflow.py`
  - `cloud_sync_pdpa_audit_workflow.py`

## Running Workflows in Antigravity Cloud
Invoke any workflow via the `run_workflow` tool:
- `run_workflow(ScriptPath=".agents/workflows/monthly_hq_report_workflow.py", Args={"month": "2026-10"}, Description="Generate Monthly HQ Presentation Plan")`
- `run_workflow(ScriptPath=".agents/workflows/cloud_sync_pdpa_audit_workflow.py", Description="Audit Hybrid Cloud Sync & PDPA Boundary")`

## Environment Secrets (Do NOT Commit)
Set runtime credentials in your Antigravity Cloud environment or CI secrets:
- `PMG_GOOGLE_SERVICE_ACCOUNT_JSON` (full service account JSON string) **or**
- `GOOGLE_APPLICATION_CREDENTIALS` (path to service account JSON outside git)
