// js/fy2027-kpi-engine.js — PMG Pharmacy Kota Sentosa (KS01) FY2027 Retail Branch KPI Automation Engine
// Shared pure scoring, cut-off countdown, Google Review simulator, WhatsApp Morning Huddle generator,
// and non-PII cross-module cloud vault sync (PMG_FY2027_KPI_VAULT_KS01).
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.PmgFy2027Kpi = api;
    window.FY2027_BRANCH_DEFAULTS = api.FY2027_BRANCH_DEFAULTS;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FY2027_VAULT_KEY = 'PMG_FY2027_KPI_VAULT_KS01';
  const FY2027_LOCAL_STORAGE_KEY = 'pmg_fy2027_kpi_vault_ks01';

  const FY2027_BRANCH_DEFAULTS = Object.freeze({
    branchCode: 'KS01',
    branchName: 'Kota Sentosa',
    monthlyCutOffDay: 14,
    googleReviewUrl: 'https://g.page/r/CUU3ygRE9IC6EBM/review',
    medicareAppIosUrl: 'https://apps.apple.com/my/app/public-medicare/id6761357301',
    medicareAppAndroidUrl: 'https://play.google.com/store/apps/details?id=com.pmg.publicmedicare',
    googleFlowUrl: 'https://flow.google.com/',
    fy2026UniqueCustomerBase: null
  });

  const TIERS = {
    EXCELLENT:    { label: 'Excellent',    multiplier: 1.0, badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    GOOD:         { label: 'Good',         multiplier: 0.8, badge: 'bg-teal-100 text-teal-800 border-teal-300' },
    AVERAGE:      { label: 'Average',      multiplier: 0.6, badge: 'bg-sky-100 text-sky-800 border-sky-300' },
    FAIR:         { label: 'Fair',         multiplier: 0.4, badge: 'bg-amber-100 text-amber-800 border-amber-300' },
    POOR:         { label: 'Poor',         multiplier: 0.2, badge: 'bg-orange-100 text-orange-800 border-orange-300' },
    UNACCEPTABLE: { label: 'Unacceptable', multiplier: 0.0, badge: 'bg-rose-100 text-rose-800 border-rose-300' },
    PENDING:      { label: 'Pending Data', multiplier: 0.0, badge: 'bg-slate-100 text-slate-600 border-slate-300' }
  };

  function round2(n) {
    return Number.isFinite(n) ? +(n.toFixed(2)) : 0;
  }

  function getCurrentMonthKey(refDate) {
    const d = refDate instanceof Date ? refDate : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  function getDaysUntilMonthlyCutOff(cutOffDay = FY2027_BRANCH_DEFAULTS.monthlyCutOffDay, refDate) {
    const now = refDate instanceof Date ? refDate : new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let target = new Date(now.getFullYear(), now.getMonth(), cutOffDay);
    const isPastThisMonth = today.getDate() > cutOffDay;
    if (isPastThisMonth) {
      target = new Date(now.getFullYear(), now.getMonth() + 1, cutOffDay);
    }
    const diffMs = target.getTime() - today.getTime();
    const daysRemaining = Math.round(diffMs / 86400000);
    const isoTarget = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    return {
      cutOffDay,
      daysRemaining,
      isDueToday: daysRemaining === 0,
      isUrgent: daysRemaining <= 3,
      isPastThisMonth,
      nextCutOffDate: isoTarget,
      monthKey: getCurrentMonthKey(today)
    };
  }

  function getRemainingDaysInMonth(refDate) {
    const now = refDate instanceof Date ? refDate : new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Math.max(1, lastDay - now.getDate() + 1);
  }

  function scoreAscending(val, bands) {
    // bands = [{ min, tier }, ...] ordered from EXCELLENT to POOR
    if (val === null || val === undefined || Number.isNaN(Number(val))) return TIERS.PENDING;
    const v = Number(val);
    for (const b of bands) {
      if (v >= b.min) return b.tier;
    }
    return TIERS.UNACCEPTABLE;
  }

  function calculateFiveStarReviewsNeeded(currentCount, currentRating, targetRating = 4.90, minReviews = 250) {
    const n = Math.max(0, Number(currentCount) || 0);
    const r = Math.min(5, Math.max(0, Number(currentRating) || 0));
    const t = Math.min(4.99, Math.max(1, Number(targetRating) || 4.90));
    const minCountGap = Math.max(0, minReviews - n);
    let ratingGap = 0;
    if (r < t) {
      // (n*r + 5*x) / (n + x) >= t  =>  x >= n*(t - r) / (5 - t)
      const rawNeeded = (n * (t - r)) / (5 - t);
      ratingGap = Math.max(0, Math.ceil(rawNeeded - 1e-9));
    }
    const needed = Math.max(minCountGap, ratingGap);
    const projectedCount = n + needed;
    const projectedRating = projectedCount > 0 ? round2((n * r + 5 * needed) / projectedCount) : 5.0;
    return {
      currentCount: n,
      currentRating: round2(r),
      targetRating: t,
      minReviews,
      fiveStarNeeded: needed,
      projectedCount,
      projectedRating
    };
  }

  /**
   * Auto-detects Free Glucose Screening transactions from Xilnex ITEM_SALES CSV
   * without requiring any manual POS counter. Matches zero-priced glucose screening/strip rows.
   */
  function detectFreeGlucoseFromItemSales(items, totalTransactions) {
    const list = Array.isArray(items) ? items : [];
    let screeningQty = 0;
    const matchedItems = [];
    list.forEach(it => {
      const code = String(it.itemCode || it.code || '').toUpperCase();
      const name = String(it.itemName || it.name || '').toUpperCase();
      const price = Number(it.netSoldPrice ?? it.sales ?? it.amount ?? 0);
      const qty = Number(it.qty ?? it.quantity ?? it.soldQty ?? 0);
      const isGlucoseTest =
        code.includes('142499') ||
        (name.includes('GLUCOSE') && (name.includes('FREE') || name.includes('SCREEN') || name.includes('TEST') || (name.includes('STRIP') && price <= 0.01)));
      if (isGlucoseTest && qty > 0) {
        screeningQty += qty;
        matchedItems.push({ code: it.itemCode || it.code || '', name: it.itemName || it.name || '', qty, price });
      }
    });
    const tx = Number(totalTransactions) || 0;
    const pctOfTx = tx > 0 ? round2((screeningQty / tx) * 100) : null;
    const targetScans = tx > 0 ? Math.ceil(tx * 0.09) : null;
    return {
      screeningQty,
      totalTransactions: tx,
      pctOfTx,
      targetScans,
      gapScans: targetScans !== null ? Math.max(0, targetScans - screeningQty) : null,
      matchedItems
    };
  }

  /**
   * Auto-matches HQ Monthly Marketing Campaign SKU codes against Xilnex ITEM_SALES CSV.
   */
  function matchCampaignSkusFromItemSales(items, campaignSkuCodes, totalSalesRm) {
    const list = Array.isArray(items) ? items : [];
    const codeSet = new Set(
      (Array.isArray(campaignSkuCodes) ? campaignSkuCodes : String(campaignSkuCodes || '').split(/[\n,;\s]+/))
        .map(s => String(s || '').trim().toUpperCase())
        .filter(Boolean)
    );
    if (codeSet.size === 0 || list.length === 0) {
      return { matchedCount: 0, campaignSalesRm: 0, pctOfTotalSales: null, topMatched: [] };
    }
    let campaignSalesRm = 0;
    const matched = [];
    list.forEach(it => {
      const rawCode = String(it.itemCode || it.code || '').trim().toUpperCase();
      const baseCode = rawCode.split(' - ')[0].trim();
      if (codeSet.has(rawCode) || codeSet.has(baseCode)) {
        const sales = Number(it.netSoldPrice ?? it.sales ?? it.amount ?? 0);
        campaignSalesRm += sales;
        matched.push({
          itemCode: it.itemCode || it.code || baseCode,
          itemName: it.itemName || it.name || '',
          sales: round2(sales),
          qty: Number(it.qty ?? it.quantity ?? 0)
        });
      }
    });
    matched.sort((a, b) => b.sales - a.sales);
    const ts = Number(totalSalesRm) || 0;
    return {
      matchedCount: matched.length,
      campaignSalesRm: round2(campaignSalesRm),
      pctOfTotalSales: ts > 0 ? round2((campaignSalesRm / ts) * 100) : null,
      topMatched: matched.slice(0, 10)
    };
  }

  function evaluateStockCycleTier(months) {
    if (months === null || months === undefined || Number.isNaN(Number(months)) || Number(months) <= 0) {
      return TIERS.PENDING;
    }
    const v = Number(months);
    if (v >= 1.50 && v <= 2.00) return TIERS.EXCELLENT;
    if ((v > 2.00 && v <= 2.25) || (v >= 1.35 && v < 1.50)) return TIERS.GOOD;
    if ((v > 2.25 && v <= 2.50) || (v >= 1.20 && v < 1.35)) return TIERS.AVERAGE;
    if ((v > 2.50 && v <= 2.75) || (v >= 1.00 && v < 1.20)) return TIERS.FAIR;
    if (v > 2.75 && v <= 3.00) return TIERS.POOR;
    return TIERS.UNACCEPTABLE;
  }

  function evaluateGoogleReviewTier(count, rating) {
    if (count === null || count === undefined || rating === null || rating === undefined || count === '' || rating === '') {
      return TIERS.PENDING;
    }
    const c = Number(count);
    const r = Number(rating);
    if (!Number.isFinite(c) || !Number.isFinite(r) || c < 250) return TIERS.UNACCEPTABLE;
    if (r >= 5.00) return TIERS.EXCELLENT;
    if (r >= 4.90) return TIERS.GOOD;
    if (r >= 4.80) return TIERS.AVERAGE;
    if (r >= 4.75) return TIERS.FAIR;
    if (r >= 4.70) return TIERS.POOR;
    return TIERS.UNACCEPTABLE;
  }

  function calcRmGapToGrowth(latest, prev, targetGrowthPct) {
    if (!prev || prev <= 0) return null;
    const neededTotal = prev * (1 + targetGrowthPct / 100);
    return round2(Math.max(0, neededTotal - latest));
  }

  /**
   * Evaluates all auto-computable & cross-module FY2027 Retail Branch KPIs (>6Y scorecard).
   * @param {Object} metrics Output of computeAllMetrics() from performance/performance.js
   * @param {Object} vault   Optional cross-module signals & Area Manager baseline fields
   */
  function evaluateFy2027AutoKpis(metrics, vault = {}) {
    const o = (metrics && metrics.outlet) || {};
    const hq = (metrics && metrics.catSummaryHq11) || {};
    const all12 = (metrics && metrics.catSummaryAll12) || {};
    const itemsL = (metrics && metrics.skuComparison) || [];
    const remainingDays = Number(vault.remainingDays) || getRemainingDaysInMonth();

    // East Malaysia High Margin = HM + EHM
    const hmPlusEhmLatest = o.hmPlusEhmLatest !== undefined
      ? Number(o.hmPlusEhmLatest)
      : round2((Number(o.hmLatest) || 0) + (Number(o.ehmLatest) || 0));
    const hmPlusEhmPrev = o.hmPlusEhmPrev !== undefined
      ? Number(o.hmPlusEhmPrev)
      : round2((Number(o.hmPrev) || 0) + (Number(o.ehmPrev) || 0));
    const hmPlusEhmYoYPct = (o.hmPlusEhmDiffPct !== undefined && o.hmPlusEhmDiffPct !== null && hmPlusEhmPrev > 0)
      ? Number(o.hmPlusEhmDiffPct)
      : (hmPlusEhmPrev > 0 ? round2(((hmPlusEhmLatest - hmPlusEhmPrev) / hmPlusEhmPrev) * 100) : null);

    // Overall GP%: prefer all12 category GP% if available, else personalGpTotalLatest
    const gpPctLatest = all12.gpPctLatest > 0
      ? Number(all12.gpPctLatest)
      : Number(o.personalGpTotalLatest?.gpMarginPct || 0);
    const gpPctDiffPP = gpPctLatest > 0
      ? (all12.gpPctLatest > 0
          ? Number(all12.gpPctDiffPP || 0)
          : Number(o.personalGpMarginDiffPP || 0))
      : null;
    const gpAutoOverride = gpPctLatest >= 30.00;

    // Stock Cycle (HQ 11 Focus Categories)
    const stockCycleMonths = Number(hq.averageStockCycle || all12.averageStockCycle || 0) || null;

    // Campaign SKU % (auto-matched from HQ campaign SKU list against Xilnex ITEM_SALES)
    const campaignMatch = matchCampaignSkusFromItemSales(
      itemsL.map(s => ({ itemCode: s.itemCode, itemName: s.itemName, netSoldPrice: s.priceLatest ?? s.netSoldPrice, qty: s.qtyLatest ?? s.qty })),
      vault.campaignSkuCodes || [],
      o.tsLatest || 0
    );
    const campaignPct = campaignMatch.pctOfTotalSales !== null
      ? campaignMatch.pctOfTotalSales
      : (vault.campaignPctOverride !== undefined && vault.campaignPctOverride !== null && vault.campaignPctOverride !== '' ? Number(vault.campaignPctOverride) : null);

    // Free Glucose Screening auto-detection from Xilnex ITEM_SALES
    const freeGlucoseAuto = detectFreeGlucoseFromItemSales(
      itemsL.map(s => ({ itemCode: s.itemCode, itemName: s.itemName, netSoldPrice: s.priceLatest ?? s.netSoldPrice, qty: s.qtyLatest ?? s.qty })),
      o.txLatest || 0
    );
    const freeGlucosePct = freeGlucoseAuto.pctOfTx !== null && freeGlucoseAuto.screeningQty > 0
      ? freeGlucoseAuto.pctOfTx
      : null;

    // Medicare App Onboarding %
    const uniqueBase = Number(vault.fy2026UniqueCustomerBase) || 0;
    const appNewMembers = vault.medicareAppNewTx !== undefined && vault.medicareAppNewTx !== null && vault.medicareAppNewTx !== ''
      ? Number(vault.medicareAppNewTx)
      : null;
    const medicareAppPct = (uniqueBase > 0 && appNewMembers !== null)
      ? round2((appNewMembers / uniqueBase) * 100)
      : null;

    // Cross-module automated signals
    const cycleCountPct = vault.inventoryAccuracyPct !== undefined && vault.inventoryAccuracyPct !== null ? Number(vault.inventoryAccuracyPct) : null;
    const expiryOnTimePct = vault.expiryCompliancePct !== undefined && vault.expiryCompliancePct !== null ? Number(vault.expiryCompliancePct) : null;
    const complianceAuditPct = vault.complianceAuditPct !== undefined && vault.complianceAuditPct !== null ? Number(vault.complianceAuditPct) : null;
    const miniMemberDayRoi = vault.miniMemberDayRoi !== undefined && vault.miniMemberDayRoi !== null && vault.miniMemberDayRoi !== '' ? Number(vault.miniMemberDayRoi) : null;

    const kpis = [];
    const pushKpi = (id, section, name, weight, isBonus, actualDisplay, tier, gapText, source) => {
      const weightedScore = round2(weight * tier.multiplier);
      kpis.push({
        id,
        section,
        name,
        weight,
        isBonus,
        actualDisplay,
        tier: tier.label,
        tierBadge: tier.badge,
        multiplier: tier.multiplier,
        weightedScore,
        maxGain: round2(weight - weightedScore),
        gapText,
        source
      });
    };

    // A1. SSSG — Home Brand Sales (15%)
    const hbValForTier = (o.hbPrev > 0) ? o.hbDiffPct : null;
    const hbTier = scoreAscending(hbValForTier, [
      { min: 10.00, tier: TIERS.EXCELLENT },
      { min: 8.08,  tier: TIERS.GOOD },
      { min: 6.15,  tier: TIERS.AVERAGE },
      { min: 4.23,  tier: TIERS.FAIR },
      { min: 0.00,  tier: TIERS.POOR }
    ]);
    const hbGapRm = calcRmGapToGrowth(o.hbLatest || 0, o.hbPrev || 0, 10.00);
    pushKpi('A1', 'A. Sales Growth', 'SSSG — Home Brand Sales', 15.0, false,
      o.hbPrev > 0 ? `${o.hbDiffPct >= 0 ? '+' : ''}${round2(o.hbDiffPct)}%` : 'N/A',
      hbTier,
      hbGapRm === null ? 'Upload Daily Sales CSV (Latest & Prev Year) to auto-calculate'
        : (hbGapRm > 0 ? `Need +RM ${hbGapRm.toLocaleString()} (RM ${Math.ceil(hbGapRm / remainingDays).toLocaleString()}/day) for Excellent (≥10%)` : '✅ Excellent (≥10%) achieved'),
      'Auto: Xilnex Daily Sales');

    // A2. SSSG — Total Sales (10%)
    const tsValForTier = (o.tsPrev > 0) ? o.tsDiffPct : null;
    const tsTier = scoreAscending(tsValForTier, [
      { min: 6.50, tier: TIERS.EXCELLENT },
      { min: 5.20, tier: TIERS.GOOD },
      { min: 3.90, tier: TIERS.AVERAGE },
      { min: 2.60, tier: TIERS.FAIR },
      { min: 0.00, tier: TIERS.POOR }
    ]);
    const tsGapRm = calcRmGapToGrowth(o.tsLatest || 0, o.tsPrev || 0, 6.50);
    pushKpi('A2', 'A. Sales Growth', 'SSSG — Total Sales', 10.0, false,
      o.tsPrev > 0 ? `${o.tsDiffPct >= 0 ? '+' : ''}${round2(o.tsDiffPct)}%` : 'N/A',
      tsTier,
      tsGapRm === null ? 'Upload Daily Sales CSV (Latest & Prev Year) to auto-calculate'
        : (tsGapRm > 0 ? `Need +RM ${tsGapRm.toLocaleString()} (RM ${Math.ceil(tsGapRm / remainingDays).toLocaleString()}/day) for Excellent (≥6.5%)` : '✅ Excellent (≥6.5%) achieved'),
      'Auto: Xilnex Daily Sales');

    // A3. SSSG — High Margin Sales (East Malaysia: HM + EHM) (5%)
    const hmTier = scoreAscending(hmPlusEhmYoYPct, [
      { min: 10.00, tier: TIERS.EXCELLENT },
      { min: 8.08,  tier: TIERS.GOOD },
      { min: 6.15,  tier: TIERS.AVERAGE },
      { min: 4.23,  tier: TIERS.FAIR },
      { min: 0.00,  tier: TIERS.POOR }
    ]);
    const hmGapRm = calcRmGapToGrowth(hmPlusEhmLatest, hmPlusEhmPrev, 10.00);
    pushKpi('A3', 'A. Sales Growth', 'SSSG — High Margin (EM: HM + EHM)', 5.0, false,
      hmPlusEhmYoYPct !== null ? `${hmPlusEhmYoYPct >= 0 ? '+' : ''}${round2(hmPlusEhmYoYPct)}%` : 'N/A',
      hmTier,
      hmGapRm === null ? 'Upload Daily Sales CSV (Latest & Prev Year) to auto-calculate HM+EHM'
        : (hmGapRm > 0 ? `Need +RM ${hmGapRm.toLocaleString()} HM+EHM (RM ${Math.ceil(hmGapRm / remainingDays).toLocaleString()}/day) for ≥10%` : '✅ Excellent (≥10%) achieved'),
      'Auto: Xilnex HM + EHM');

    // A4. SSSG — Number of Customers (5%)
    const txValForTier = (o.txPrev > 0) ? o.txDiffPct : null;
    const txTier = scoreAscending(txValForTier, [
      { min: 1.40, tier: TIERS.EXCELLENT },
      { min: 1.00, tier: TIERS.GOOD },
      { min: 0.60, tier: TIERS.AVERAGE },
      { min: 0.20, tier: TIERS.FAIR },
      { min: 0.00, tier: TIERS.POOR }
    ]);
    const txGap = o.txPrev > 0 ? Math.max(0, Math.ceil(o.txPrev * 1.014 - (o.txLatest || 0))) : null;
    pushKpi('A4', 'A. Sales Growth', 'SSSG — Number of Customers', 5.0, false,
      o.txPrev > 0 ? `${o.txDiffPct >= 0 ? '+' : ''}${round2(o.txDiffPct)}%` : 'N/A',
      txTier,
      txGap === null ? 'Upload Customers Served CSV (Latest & Prev Year) to auto-calculate'
        : (txGap > 0 ? `Need +${txGap.toLocaleString()} receipts (+${Math.ceil(txGap / remainingDays)}/day) — use Patient Recall & Free Glucose invites` : '✅ Excellent (≥1.4%) achieved'),
      'Auto: Xilnex Customers Served');

    // A5. SSSG — Basket Size / ATV (5%)
    const atvValForTier = (o.basketTsPrev > 0) ? o.basketTsDiffPct : null;
    const atvTier = scoreAscending(atvValForTier, [
      { min: 5.00, tier: TIERS.EXCELLENT },
      { min: 3.80, tier: TIERS.GOOD },
      { min: 2.60, tier: TIERS.AVERAGE },
      { min: 1.40, tier: TIERS.FAIR },
      { min: 0.00, tier: TIERS.POOR }
    ]);
    const targetAtv = o.basketTsPrev > 0 ? round2(o.basketTsPrev * 1.05) : null;
    pushKpi('A5', 'A. Sales Growth', 'SSSG — Basket Size / ATV', 5.0, false,
      o.basketTsPrev > 0 ? `${o.basketTsDiffPct >= 0 ? '+' : ''}${round2(o.basketTsDiffPct)}% (RM ${round2(o.basketTsLatest)})` : 'N/A',
      atvTier,
      targetAtv === null ? 'Upload Daily Sales & Customers Served CSVs to auto-calculate ATV'
        : (o.basketTsLatest < targetAtv ? `Need RM ${round2(targetAtv - o.basketTsLatest)} higher ATV (Target: RM ${targetAtv}) via add-on bundles` : '✅ Excellent (≥5.0%) achieved'),
      'Auto: Xilnex ATV');

    // B6. Overall GP% Improvement (10%) + Auto-Excellent Override >= 30.00%
    const gpTier = gpAutoOverride
      ? TIERS.EXCELLENT
      : scoreAscending(gpPctDiffPP, [
          { min: 1.80, tier: TIERS.EXCELLENT },
          { min: 1.35, tier: TIERS.GOOD },
          { min: 0.90, tier: TIERS.AVERAGE },
          { min: 0.45, tier: TIERS.FAIR },
          { min: 0.00, tier: TIERS.POOR }
        ]);
    const gpOverrideGap = round2(Math.max(0, 30.00 - gpPctLatest));
    pushKpi('B6', 'B. Store Profitability', 'Overall GP% (Override ≥30.00% = Excellent)', 10.0, false,
      gpPctLatest > 0 ? `${round2(gpPctLatest)}% (${gpPctDiffPP >= 0 ? '+' : ''}${round2(gpPctDiffPP)}pp)${gpAutoOverride ? ' ★OVERRIDE' : ''}` : 'N/A',
      gpTier,
      gpPctLatest <= 0
        ? 'Upload Category GP or Personal GP CSV to auto-calculate'
        : (gpAutoOverride
            ? '✅ 30.00% Auto-Excellent Override Active!'
            : `Need +${gpOverrideGap}pp to hit 30.00% Auto-Excellent Override (or +${round2(Math.max(0, 1.80 - (gpPctDiffPP || 0)))}pp YoY)`),
      'Auto: Xilnex Category GP');

    // C7. Sales Campaign Achievement (7.5%)
    const campTier = scoreAscending(campaignPct, [
      { min: 25.00, tier: TIERS.EXCELLENT },
      { min: 20.00, tier: TIERS.GOOD },
      { min: 15.00, tier: TIERS.AVERAGE },
      { min: 10.00, tier: TIERS.FAIR },
      { min: 5.00,  tier: TIERS.POOR }
    ]);
    pushKpi('C7', 'C. Marketing, CX & Digital', 'Sales Campaign Achievement (≥25% of Sales)', 7.5, false,
      campaignPct !== null ? `${round2(campaignPct)}%` : 'Paste Campaign SKUs',
      campTier,
      campaignPct === null
        ? 'Paste HQ monthly campaign SKU list in Promo Hub to auto-calculate'
        : (campaignPct < 25 ? `Need +${round2(25 - campaignPct)}pp campaign share (push top promo SKUs at counter & WhatsApp)` : '✅ Excellent (≥25%) achieved'),
      'Auto: Campaign SKUs × Item Sales');

    // C9. Medicare Apps Onboarding (2.5%)
    const appTier = scoreAscending(medicareAppPct, [
      { min: 10.00, tier: TIERS.EXCELLENT },
      { min: 8.00,  tier: TIERS.GOOD },
      { min: 6.00,  tier: TIERS.AVERAGE },
      { min: 4.00,  tier: TIERS.FAIR },
      { min: 2.00,  tier: TIERS.POOR }
    ]);
    pushKpi('C9', 'C. Marketing, CX & Digital', 'Medicare Apps Onboarding (≥10% FY26 Base)', 2.5, false,
      medicareAppPct !== null ? `${round2(medicareAppPct)}%` : (uniqueBase > 0 ? `Base: ${uniqueBase.toLocaleString()}` : 'Await AM Base'),
      appTier,
      uniqueBase > 0
        ? `Target: ${Math.ceil(uniqueBase * 0.10).toLocaleString()} app member tx — iOS & Android links auto-injected in WhatsApp`
        : 'Enter FY2026 unique customer base when AM sends monthly KPI report',
      'Auto-Driven: WhatsApp App Links');

    // C11. Google Review (min 250 reviews) (2.5%)
    const revTier = evaluateGoogleReviewTier(vault.googleReviewCount, vault.googleReviewRating);
    const hasRevInputs = vault.googleReviewCount !== null && vault.googleReviewCount !== undefined && vault.googleReviewCount !== ''
      && vault.googleReviewRating !== null && vault.googleReviewRating !== undefined && vault.googleReviewRating !== '';
    const revSim = hasRevInputs
      ? calculateFiveStarReviewsNeeded(vault.googleReviewCount, vault.googleReviewRating, 4.90, 250)
      : null;
    pushKpi('C11', 'C. Marketing, CX & Digital', 'Google Review (Min 250 Reviews, 5.00★)', 2.5, false,
      revSim ? `${revSim.currentRating}★ (${revSim.currentCount} rev)` : 'Set Current Rating',
      revTier,
      revSim
        ? (revSim.fiveStarNeeded > 0 ? `Need ${revSim.fiveStarNeeded} more 5★ reviews to hit 4.90★ (≥250) — auto-injected in Patient Care WhatsApp` : '✅ ≥250 reviews & ≥4.90★ achieved')
        : 'Auto-injected KS01 Google Review link in Patient Care WhatsApp follow-ups',
      'Auto-Driven: Patient Care WhatsApp');

    // D12. Inventory Accuracy (200-250 SKUs before 14th) (5%)
    const invTier = scoreAscending(cycleCountPct, [
      { min: 100, tier: TIERS.EXCELLENT },
      { min: 90,  tier: TIERS.GOOD },
      { min: 80,  tier: TIERS.AVERAGE },
      { min: 70,  tier: TIERS.FAIR },
      { min: 60,  tier: TIERS.POOR }
    ]);
    const cutOff = getDaysUntilMonthlyCutOff(FY2027_BRANCH_DEFAULTS.monthlyCutOffDay);
    pushKpi('D12', 'D. Inventory Management', 'Inventory Accuracy (200–250 SKUs by 14th)', 5.0, false,
      cycleCountPct !== null ? `${round2(cycleCountPct)}%` : `Due in ${cutOff.daysRemaining}d`,
      invTier,
      `Cut-off: 14th (${cutOff.daysRemaining}d left) — use 1-Click 250-SKU Generator in Smart Inventory`,
      'Auto: Inventory Cycle Engine');

    // D13. Stock Cycle (1.50 - 2.00 months) (2.5%)
    const scTier = evaluateStockCycleTier(stockCycleMonths);
    pushKpi('D13', 'D. Inventory Management', 'Stock Cycle (1.50 – 2.00 Months)', 2.5, false,
      stockCycleMonths ? `${stockCycleMonths.toFixed(2)} mo` : 'N/A',
      scTier,
      stockCycleMonths
        ? (stockCycleMonths > 2.00
          ? `Over target by +${(stockCycleMonths - 2.00).toFixed(2)} mo — enable 2.0-Mo PO Cap in Smart Inventory`
          : (stockCycleMonths < 1.50 ? `Under 1.50 mo risk — replenish fast-movers` : '✅ Optimal 1.50–2.00 mo band'))
        : 'Upload Stock Closing CSV',
      'Auto: Xilnex Stock Closing');

    // D14. Expiry Management (Before 14th + 0 Blank Plans) (2.5%)
    const expTier = scoreAscending(expiryOnTimePct, [
      { min: 100, tier: TIERS.EXCELLENT },
      { min: 90,  tier: TIERS.GOOD },
      { min: 80,  tier: TIERS.AVERAGE },
      { min: 70,  tier: TIERS.FAIR },
      { min: 60,  tier: TIERS.POOR }
    ]);
    pushKpi('D14', 'D. Inventory Management', 'Expiry Management (100% Plans by 14th)', 2.5, false,
      expiryOnTimePct !== null ? `${round2(expiryOnTimePct)}%` : `Due in ${cutOff.daysRemaining}d`,
      expTier,
      `Cut-off: 14th (${cutOff.daysRemaining}d left) — use 1-Click Auto-Fill Blank Action Plans in Expiry Tracker`,
      'Auto: Expiry Readiness Engine');

    // E15. Branch Compliance Audit (15%)
    const audTier = scoreAscending(complianceAuditPct, [
      { min: 90.00, tier: TIERS.EXCELLENT },
      { min: 85.00, tier: TIERS.GOOD },
      { min: 80.00, tier: TIERS.AVERAGE },
      { min: 75.00, tier: TIERS.FAIR },
      { min: 70.00, tier: TIERS.POOR }
    ]);
    pushKpi('E15', 'E. Compliance', 'Branch Compliance Audit (≥90%, All Cats ≥80%)', 15.0, false,
      complianceAuditPct !== null ? `${round2(complianceAuditPct)}%` : 'Run Audit Risk Scan',
      audTier,
      complianceAuditPct !== null && complianceAuditPct < 90
        ? `Need +${round2(90 - complianceAuditPct)}% (≥180/200) — check <80% Bonus-Killer flags in Audit Hub`
        : 'Auto-scored from 5S Video + Inventory Accuracy + Expiry Readiness',
      'Auto: 200-Pt Audit Risk Detector');

    // G18. BONUS — Diabetes Care Free Glucose Screening (≥9.00% of tx) (+5%)
    const gluTier = scoreAscending(freeGlucosePct, [
      { min: 9.00, tier: TIERS.EXCELLENT },
      { min: 7.20, tier: TIERS.GOOD },
      { min: 5.40, tier: TIERS.AVERAGE },
      { min: 3.60, tier: TIERS.FAIR },
      { min: 1.80, tier: TIERS.POOR }
    ]);
    pushKpi('G18', 'G. Bonus KPI', 'BONUS: Free Glucose Screening (≥9.00% tx)', 5.0, true,
      freeGlucosePct !== null ? `${round2(freeGlucosePct)}% (${freeGlucoseAuto.screeningQty} scans)` : 'Auto-from Xilnex CSV',
      gluTier,
      freeGlucoseAuto.gapScans !== null && freeGlucoseAuto.gapScans > 0
        ? `Need +${freeGlucoseAuto.gapScans} screenings (${Math.ceil(freeGlucoseAuto.gapScans / remainingDays)}/day) — auto-invited in Patient WhatsApp`
        : 'POS auto-prices RM0; Free Glucose invite auto-embedded in Patient WhatsApp reminders',
      'Auto: Xilnex Item Sales + WhatsApp');

    // G19. BONUS — Mini Member Day ROI (≥2.50) (+5%)
    const roiTier = scoreAscending(miniMemberDayRoi, [
      { min: 2.50, tier: TIERS.EXCELLENT },
      { min: 2.13, tier: TIERS.GOOD },
      { min: 1.75, tier: TIERS.AVERAGE },
      { min: 1.38, tier: TIERS.FAIR },
      { min: 1.00, tier: TIERS.POOR }
    ]);
    pushKpi('G19', 'G. Bonus KPI', 'BONUS: Mini Member Day ROI (≥2.50×)', 5.0, true,
      miniMemberDayRoi !== null ? `${round2(miniMemberDayRoi)}× ROI` : 'Plan in Promo Hub',
      roiTier,
      'Use Mini Member Day VIP Pre-Order Engine in Promo Hub to lock in ≥2.50× ROI before event day',
      'Auto: Promo Hub VIP Engine');

    const coreKpis = kpis.filter(k => !k.isBonus);
    const bonusKpis = kpis.filter(k => k.isBonus);
    const coreScore = round2(coreKpis.reduce((s, k) => s + k.weightedScore, 0));
    const coreWeightTracked = round2(coreKpis.reduce((s, k) => s + k.weight, 0));
    const bonusScore = round2(bonusKpis.reduce((s, k) => s + k.weightedScore, 0));
    const totalCappedScore = round2(Math.min(100, coreScore + bonusScore));

    return {
      kpis,
      coreScore,
      coreWeightTracked,
      bonusScore,
      totalCappedScore,
      gpAutoOverride,
      hmPlusEhmLatest,
      hmPlusEhmPrev,
      hmPlusEhmYoYPct,
      campaignMatch,
      freeGlucoseAuto,
      cutOff,
      remainingDays
    };
  }

  /**
   * Generates a crisp, 1-click Morning Branch Huddle WhatsApp message for the KS01 team.
   */
  function buildDailyTeamHuddleWhatsApp(scorecard, metrics, customDateLabel) {
    const sc = scorecard || evaluateFy2027AutoKpis(metrics || {});
    const o = (metrics && metrics.outlet) || {};
    const topSkus = (metrics && metrics.topHeroSkus ? metrics.topHeroSkus.slice(0, 5) : []);
    const dateStr = customDateLabel || new Date().toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    const a1 = sc.kpis.find(k => k.id === 'A1');
    const a2 = sc.kpis.find(k => k.id === 'A2');
    const a3 = sc.kpis.find(k => k.id === 'A3');
    const b6 = sc.kpis.find(k => k.id === 'B6');

    const lines = [
      `🌅 *PMG KOTA SENTOSA (KS01) — MORNING KPI HUDDLE*`,
      `📅 ${dateStr} | ⏳ ${sc.remainingDays} days left this month`,
      ``,
      `🎯 *TODAY'S FY2027 PRIORITY TARGETS:*`,
      `• *Home Brand (15% wt):* ${a1 ? a1.actualDisplay : 'N/A'} → ${a1 ? a1.gapText : ''}`,
      `• *Total Sales (10% wt):* ${a2 ? a2.actualDisplay : 'N/A'} → ${a2 ? a2.gapText : ''}`,
      `• *High Margin HM+EHM (5% wt):* ${a3 ? a3.actualDisplay : 'N/A'} → ${a3 ? a3.gapText : ''}`,
      `• *GP% (10% wt):* ${b6 ? b6.actualDisplay : 'N/A'} → ${b6 ? b6.gapText : ''}`,
      ``,
      `💡 *COUNTER FOCUS (HIGHEST SCORE IMPACT):*`,
      `1. Recommend Home Brand / HM+EHM upgrades on every consultation`,
      `2. Offer *FREE Blood Glucose Check* to walk-in & chronic customers (auto RM0 in POS)`,
      `3. Ask happy customers for a quick 5★ Google Review + Public Medicare App sign-up`,
      `⏰ *14th Cut-Off Countdown:* ${sc.cutOff.daysRemaining} days left (250-SKU Cycle Count & Expiry Form)`
    ];

    if (topSkus.length > 0) {
      lines.push('', '🔥 *TOP MOMENTUM SKUs TO PUSH TODAY:*');
      topSkus.forEach((s, idx) => {
        lines.push(`${idx + 1}. ${s.itemName || s.name || s.itemCode}`);
      });
    }

    lines.push('', `Let's hit Excellent together, Team KS01! 💪`);
    return lines.join('\n');
  }

  function loadFy2027VaultLocal() {
    if (typeof localStorage === 'undefined') return { ...FY2027_BRANCH_DEFAULTS };
    try {
      const raw = localStorage.getItem(FY2027_LOCAL_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return { ...FY2027_BRANCH_DEFAULTS, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
    } catch (_) {
      return { ...FY2027_BRANCH_DEFAULTS };
    }
  }

  function saveFy2027VaultLocal(patch) {
    const current = loadFy2027VaultLocal();
    const merged = { ...current, ...(patch || {}), updatedAt: new Date().toISOString() };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(FY2027_LOCAL_STORAGE_KEY, JSON.stringify(merged));
      } catch (_) {}
    }
    return merged;
  }

  function sanitizeFy2027VaultForCloud(data) {
    if (!data || typeof data !== 'object') return {};
    if (typeof window !== 'undefined' && typeof window.sanitizePayloadForGoogleCloud === 'function') {
      return window.sanitizePayloadForGoogleCloud(data);
    }
    const clean = { ...data };
    ['ic', 'nric', 'patientIc', 'patientName', 'clinicalNotes', 'encounters', 'medications', 'vitals', 'poct', 'allergies', 'chronicConditions'].forEach(k => {
      delete clean[k];
    });
    return clean;
  }

  async function syncFy2027KpiVault(mode = 'pull', patch = null, apiUrlOverride = null) {
    const apiUrl = apiUrlOverride || (typeof window !== 'undefined' && window.PMG_SCHEDULE_API_URL) || null;
    let localData = patch ? saveFy2027VaultLocal(patch) : loadFy2027VaultLocal();
    if (!apiUrl || typeof fetch !== 'function') return localData;

    try {
      if (mode === 'push') {
        const safePayload = sanitizeFy2027VaultForCloud(localData);
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveStaffPreferences',
            branch: FY2027_VAULT_KEY,
            preferences: safePayload
          })
        });
        if (res && res.ok) return localData;
      } else {
        const res = await fetch(`${apiUrl}?action=getStaffPreferences&branch=${encodeURIComponent(FY2027_VAULT_KEY)}`);
        if (res && res.ok) {
          const json = await res.json();
          const remote = (json && (json.preferences || json.data)) || null;
          if (remote && typeof remote === 'object') {
            const remoteTs = Date.parse(remote.updatedAt || '') || 0;
            const localTs = Date.parse(localData.updatedAt || '') || 0;
            if (!localTs || remoteTs >= localTs) {
              localData = saveFy2027VaultLocal(sanitizeFy2027VaultForCloud(remote));
            }
          }
        }
      }
    } catch (_) {
      // Non-fatal offline fallback
    }
    return localData;
  }

  return {
    FY2027_VAULT_KEY,
    FY2027_LOCAL_STORAGE_KEY,
    FY2027_BRANCH_DEFAULTS,
    TIERS,
    getCurrentMonthKey,
    getDaysUntilMonthlyCutOff,
    getRemainingDaysInMonth,
    calculateFiveStarReviewsNeeded,
    detectFreeGlucoseFromItemSales,
    matchCampaignSkusFromItemSales,
    evaluateStockCycleTier,
    evaluateGoogleReviewTier,
    evaluateFy2027AutoKpis,
    buildDailyTeamHuddleWhatsApp,
    loadFy2027VaultLocal,
    saveFy2027VaultLocal,
    syncFy2027KpiVault
  };
});
