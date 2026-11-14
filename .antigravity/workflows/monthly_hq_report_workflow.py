"""
Antigravity Workflow: Monthly HQ Performance Presentation & Stock Aging Audit
Run via Antigravity `run_workflow(ScriptPath=".agents/workflows/monthly_hq_report_workflow.py", Args={"month": "2026-10"})`
"""

report_month = args.get("month", "Latest Uploaded Month")
branch = args.get("branch", "KS01 - Kota Sentosa")

phase("1. Parallel Domain Analysis (Performance, Aging, Pricing, 5S)")
analysis_tasks = [
    (
        "pmg-performance-strategist",
        f"Analyze Performance & 3-Month Teammate KPIs for {branch} ({report_month})",
        (
            f"Audit performance/performance.js datasets and Sample/ exports for {branch} ({report_month}). "
            "Summarize total sales, YoY variance, GP%, House Brand share, top 3M teammate movers, "
            "and verify 6-month+ Stock Aging category totals match filtered SKU tables + saved KS01_PERF_ACTION_PLANS. "
            "Exclude all patient medical or NRIC data."
        ),
    ),
    (
        "pmg-pricing-analyst",
        f"Audit House Brand & Competitor Pricing Integrity for {branch}",
        (
            "Inspect js/pricing-intelligence.js SWOT and SKU matrix entries. Confirm House Brand SKUs use "
            "Exclusive Private Label Strategy (zero hallucinated competitor prices) and competitor pricing URLs/models "
            "use gemini-3.5-flash-lite / gemini-3.1-flash-lite / gemini-3.8-flash."
        ),
    ),
    (
        "pmg-inventory-replenishment",
        f"Review Reorder, Expiry & RTV Action Summary for {report_month}",
        (
            "Summarize key slow-moving clearance priorities, short-expiry risks, and credit-note/RTV opportunities "
            "from js/inventory.js, js/expiry.js, and js/returns-cn.js."
        ),
    ),
]

findings = await parallel(
    analysis_tasks,
    lambda item: agent(
        prompt=item[2],
        type_name=item[0],
        role=item[1],
        schema={
            "type": "object",
            "properties": {
                "summary": {"type": "string"},
                "key_metrics": {"type": "array", "items": {"type": "string"}},
                "recommended_actions": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["summary", "key_metrics", "recommended_actions"],
        },
    ),
)

for idx, res in enumerate(findings):
    log(f"[{analysis_tasks[idx][0]}] {res.get('summary', '')}")

phase("2. Synthesize HQ Slide Deck Brief")
deck_plan = await agent(
    prompt=(
        f"Combine these verified operational findings into an executive slide-by-slide outline for "
        f"scripts/generate_monthly_deck.py ({branch}, {report_month}):\n{findings}\n"
        "Ensure zero patient clinical data is included and all numbers cite the observed findings only."
    ),
    type_name="pmg-performance-strategist",
    role="Synthesize HQ Presentation Outline",
    schema={"type": "string"},
)

log("HQ Presentation Outline Ready:")
log(deck_plan)
