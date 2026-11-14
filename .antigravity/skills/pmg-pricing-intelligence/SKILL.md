---
name: pmg-pricing-intelligence
description: Grounded competitor pricing analysis, house-brand exclusion rules, Gemini 3.x model hierarchy, and cross-PC Google Sheets sync for js/pricing-intelligence.js.
---

# PMG Pricing Intelligence & SWOT Runbook

Use this skill when maintaining, auditing, or debugging `js/pricing-intelligence.js` or executing competitor price research for Kota Sentosa (KS01).

## Core Integrity Rules
1. **Strict House Brand Detection**:
   - Never call competitor pricing scrapers/prompts on PMG Exclusive / House Brand SKUs (`HB`, Nutriforte, Vitasen, Nutribridge, Livemore, or supplier-flagged exclusive brands).
   - Instead, render the Exclusive Private Label Strategy flow (`applyHouseBrandStrategy`) with 50–60% GP target guidance and companion bundling suggestions.
2. **No Hallucinated Competitor Links or Prices**:
   - Competitors checked: Alpro Oneclick, BIG Pharmacy, Caring Pharmacy, Farley (Kuching local reference).
   - Never fabricate dead product deep links (404s); use verified live search query URLs or verified Gemini Search Grounding citations.
   - If a retailer price is unverified, leave it `N/A` / `null` rather than inventing a Malaysia RM estimate.
3. **Active Gemini Model Stack**:
   - Primary: `gemini-3.5-flash-lite`
   - Fallback: `gemini-3.1-flash-lite`
   - Strategic SWOT synthesis: `gemini-3.8-flash`
   - Forbidden (retired / 404): `gemini-2.0-flash-lite`, `gemini-2.5-flash`.
4. **Google Sheets Sync**:
   - Pull latest master pricing catalog on init via `window.pmgPricing.fetchPricingFromSheets(false)`.
   - Push verified price/cost/SP edits via `window.pmgPricing.pushPricingToSheets()`.
