"""
Antigravity Workflow: Hybrid Google Cloud Sync & Malaysia PDPA Isolation Verification
Run via Antigravity `run_workflow(ScriptPath=".agents/workflows/cloud_sync_pdpa_audit_workflow.py")`
"""

phase("1. Audit PDPA Boundary & Google Cloud Non-Patient Vaults")
modules_to_audit = [
    ("js/patient.js", "Verify PMG_PDPA_MEDICAL_CLOUD_GUARD, PMG_PDPA_FORBIDDEN_CLOUD_FIELDS, and sanitizePayloadForGoogleCloud strip clinical/POCT/NRIC data from all Google Apps Script POSTs."),
    ("js/onedrive-sync.js", "Verify triggerGoogleCloudEcosystemSync runs non-patient Google Cloud syncs even when OneDrive is disconnected while keeping patient records on OneDrive/Local only."),
    ("js/promo-broadcast.js & promo/promo.js", "Verify PMG_PROMO_BROADCAST_VAULT_KS01 syncs campaigns, composer state, and progress to Google Cloud."),
    ("js/inventory.js", "Verify PMG_INVENTORY_REPLENISHMENT_VAULT_KS01 syncs inventory thresholds and PO ZIP history to Google Cloud."),
    ("scripts/google_sheets_sync.js", "Verify zero hardcoded Roaming paths or committed credentials; relies on env vars or gitignored local JSON."),
]

audit_results = await parallel(
    modules_to_audit,
    lambda item: agent(
        prompt=f"Inspect {item[0]} in workspace {WORKSPACES[0] if WORKSPACES else '.'}: {item[1]}",
        type_name="pmg-cloud-pdpa-architect",
        role=f"PDPA & Cloud Audit: {item[0]}",
        model="flash",
        schema={
            "type": "object",
            "properties": {
                "module": {"type": "string"},
                "status": {"type": "string", "enum": ["PASS", "WARN", "FAIL"]},
                "details": {"type": "string"},
            },
            "required": ["module", "status", "details"],
        },
    ),
)

for item in audit_results:
    log(f"{item['status']} | {item['module']}: {item['details']}")

phase("2. Execute Automated Verification Suite")
test_report = await agent(
    prompt="Run `node scripts/verify_cloud_pdpa_suite.js` using run_command and report exact pass/fail counts.",
    type_name="pmg-cloud-pdpa-architect",
    role="Run Cloud & PDPA Test Suite",
    model="flash",
    schema={"type": "string"},
)

log("Automated Suite Result:")
log(test_report)
