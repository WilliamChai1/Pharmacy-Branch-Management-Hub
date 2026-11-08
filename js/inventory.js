// js/inventory.js — Module 1: Inventory Replenishment Engine
'use strict';

// ─── STATE ────────────────────────────────────────────────────────────────────
let inventoryData = [];  // Raw parsed rows from Xilnex CSV
let inventoryGrid = [];  // Calculated rows
let interBranchTransfers = []; // List of near-expiry clearance items transferred from sister branches
let stockAgingMap = new Map(); // Key: uppercase itemCode / bareCode -> { agedQty, totalOh, avgCost, agedValue, isAged }
let skuSalesTrendMap = new Map(); // Key: uppercase itemCode -> { m2Qty, m1Qty, latestQty, momentumPct, direction, unconstrainedAds }
let stockAgingStatus = { connected: false, skuCount: 0, agedCount: 0, totalAgedValue: 0, source: 'None' };
let invActiveFilterPill = 'ALL'; // 'ALL', 'REORDER', 'MOMENTUM', 'STOCKOUT', 'AGING_LOCKED', 'SURPLUS'

// ─── PACKAGING SPECIFICATION & UOM CONVERSION PARSER ─────────────────────────
/**
 * Normalizes UOM strings to standard catalog formats
 */
function normalizeUom(val) {
  if (!val) return 'PCS';
  const s = String(val).trim().toUpperCase();
  if (s === 'PC' || s === 'PCS' || s === 'PIECE' || s === 'PIECES' || s === 'UNIT' || s === 'UNITS' || s === 'EA' || s === 'EACH') return 'PCS';
  if (s === 'BOX' || s === 'BOXES' || s === 'BX') return 'BOX';
  if (s === 'STRIP' || s === 'STRIPS' || s === 'STP') return 'STRIP';
  if (s === 'SAC' || s === 'SACHET' || s === 'SACHETS') return 'SAC';
  if (s === 'BOT' || s === 'BOTTLE' || s === 'BOTTLES' || s === 'BTL') return 'BOT';
  if (s === 'TAB' || s === 'TABLET' || s === 'TABLETS') return 'TAB';
  if (s === 'CAP' || s === 'CAPSULE' || s === 'CAPSULES') return 'CAP';
  if (s === 'PACK' || s === 'PACKS' || s === 'PK' || s === 'PKT') return 'PACK';
  if (s === 'TUBE' || s === 'TUBES') return 'TUBE';
  if (s === 'CAN' || s === 'CANS' || s === 'TIN' || s === 'TINS') return 'CAN';
  if (s === 'TWINPACK' || s === 'TWIN') return 'TWINPACK';
  return s;
}

/**
 * Disambiguates Item Code and Unit of Measure (UOM) for Xilnex exports.
 * In Xilnex, sales and stock aging are tracked specifically by (Item Code + UOM),
 * e.g. "100133 - BOX" vs "100133 - STRIP", or "114682 - BOX30" vs "114682 - SAC" vs "114682 - TWINPACK".
 */
function extractItemCodeAndUom(rawItemCode, rawUom) {
  const codeStr = String(rawItemCode || '').trim().toUpperCase();
  let baseCode = codeStr;
  let suffixUom = '';
  const dashIdx = codeStr.indexOf('-');
  if (dashIdx !== -1) {
    baseCode = codeStr.substring(0, dashIdx).trim();
    suffixUom = normalizeUom(codeStr.substring(dashIdx + 1).trim());
  }
  const colUom = rawUom ? normalizeUom(rawUom) : '';
  const orderUom = colUom || suffixUom || 'PCS';
  const compositeKey = `${baseCode}::${orderUom}`;
  return { exactCode: codeStr, baseCode, orderUom, compositeKey };
}

/**
 * In PMG Xilnex catalog, the suffix after '-' defines the packaging specification:
 * - 'box30'   : 1 Box containing 30 sachets / smallest UOM (order unit: Box)
 * - 'twinpack': Twinpack containing 2 boxes of 30 sachets = 60 sachets (order unit: Twinpack)
 * - 'sac'     : 1 Sachet (smallest UOM) (order unit: Sachet)
 * - 'pack10'  : 1 Pack containing 10 units of the smallest UOM (order unit: Pack)
 * - 'bot25'   : 25 Bottles of this item (order unit: Bundle/Carton of 25 Bottles)
 * 
 * IMPORTANT: The quantity on hand (SOH) and order quantity in Xilnex are already in units
 * of that specific SKU. An order quantity of 7 for "114682 - BOX30" means 7 boxes (NOT 30 boxes!).
 */
function parsePackagingSpecification(itemCode) {
  if (!itemCode) return { smallestUomUnits: 1, baseCode: '', suffix: '', label: '1 Unit', displayTag: '1 Unit', unitType: 'Unit' };
  const str = String(itemCode).trim();
  const dashIdx = str.indexOf('-');
  const baseCode = dashIdx !== -1 ? str.substring(0, dashIdx).trim().toUpperCase() : str.toUpperCase();
  if (dashIdx === -1) return { smallestUomUnits: 1, baseCode, suffix: '', label: '1 Unit', displayTag: '1 Unit', unitType: 'Unit' };

  const suffix = str.substring(dashIdx + 1).trim();
  const sLower = suffix.toLowerCase();

  // 1. Specific twinpack rule: 2 boxes of 30 sachets = 60 sachets
  if (sLower.includes('twinpack') || sLower.includes('twin')) {
    return {
      smallestUomUnits: 60,
      boxCount: 2,
      baseCode,
      suffix,
      label: 'Twinpack (2 Boxes of 30 Sac = 60 Sac)',
      displayTag: 'Twinpack (2 Boxes)',
      unitType: 'Twinpacks'
    };
  }

  // 2. Specific triplepack rule: 3 boxes
  if (sLower.includes('triplepack') || sLower.includes('tripack')) {
    return {
      smallestUomUnits: 90,
      boxCount: 3,
      baseCode,
      suffix,
      label: 'Triplepack (3 Boxes)',
      displayTag: 'Triplepack (3 Boxes)',
      unitType: 'Triplepacks'
    };
  }

  // 3. boxN (e.g. box30 -> 30 sachets/units in 1 box)
  let m = sLower.match(/box\s*(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    return {
      smallestUomUnits: n,
      baseCode,
      suffix,
      label: `Box of ${n} (${n} Sac/Box)`,
      displayTag: `Box of ${n} (${n} Sac)`,
      unitType: 'Boxes'
    };
  }

  // 4. packN (e.g. pack10 -> 10 units of the smallest UOM)
  m = sLower.match(/pack\s*(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    return {
      smallestUomUnits: n,
      baseCode,
      suffix,
      label: `Pack of ${n} (${n} Units Smallest UOM)`,
      displayTag: `Pack of ${n}`,
      unitType: 'Packs'
    };
  }

  // 5. botN (e.g. bot25 -> 25 bottles of this item)
  m = sLower.match(/bot\s*(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    return {
      smallestUomUnits: n,
      baseCode,
      suffix,
      label: `${n} Bottles of this item`,
      displayTag: `${n} Bottles`,
      unitType: 'Bundles (25 Bot)'
    };
  }

  // 6. Sachet / sac (Smallest UOM)
  if (sLower === 'sac' || sLower === 'sachet') {
    return {
      smallestUomUnits: 1,
      baseCode,
      suffix,
      label: '1 Sachet (Smallest UOM)',
      displayTag: '1 Sachet (Smallest UOM)',
      unitType: 'Sachets'
    };
  }

  // 7. Strip / Tab / Cap / Bottle / Tube without trailing numbers
  if (sLower === 'strip') {
    return { smallestUomUnits: 1, baseCode, suffix, label: '1 Strip', displayTag: '1 Strip', unitType: 'Strips' };
  }
  if (sLower === 'cap' || sLower === 'tab') {
    return { smallestUomUnits: 1, baseCode, suffix, label: `1 ${suffix.toUpperCase()} (Smallest UOM)`, displayTag: `1 ${suffix.toUpperCase()}`, unitType: `${suffix.toUpperCase()}s` };
  }
  if (sLower === 'bot' || sLower === 'bottle') {
    return { smallestUomUnits: 1, baseCode, suffix, label: '1 Bottle', displayTag: '1 Bottle', unitType: 'Bottles' };
  }
  if (sLower === 'box') {
    return { smallestUomUnits: 1, baseCode, suffix, label: '1 Box', displayTag: '1 Box', unitType: 'Boxes' };
  }
  if (sLower === 'pack') {
    return { smallestUomUnits: 1, baseCode, suffix, label: '1 Pack', displayTag: '1 Pack', unitType: 'Packs' };
  }

  // Fallback pattern for numbers like 60's, 60s, x2
  m = sLower.match(/(?:x\s*(\d+)|\b(\d+)\s*(?:'s|s)\b)/);
  if (m) {
    const n = parseInt(m[1] || m[2], 10);
    return {
      smallestUomUnits: n,
      baseCode,
      suffix,
      label: `${suffix.toUpperCase()} (${n} Units/Pack)`,
      displayTag: suffix.toUpperCase(),
      unitType: suffix.toUpperCase()
    };
  }

  return {
    smallestUomUnits: 1,
    baseCode,
    suffix,
    label: suffix.toUpperCase() || '1 Unit',
    displayTag: suffix.toUpperCase() || '1 Unit',
    unitType: suffix.toUpperCase() || 'Units'
  };
}

// ─── STOCK AGING & SALES TREND STORAGE INTEGRATION ───────────────────────────
function syncStockAgingFromStorage() {
  try {
    let syncedAging = false;
    let syncedTrends = false;

    // 1. Try Performance Suite active state
    const rawPerf = localStorage.getItem('pmg_perf_active_state_v1');
    if (rawPerf) {
      const parsed = JSON.parse(rawPerf);
      if (parsed?.stockAgingLatest?.items && Array.isArray(parsed.stockAgingLatest.items) && parsed.stockAgingLatest.items.length > 0) {
        ingestStockAgingItems(parsed.stockAgingLatest.items, 'Performance Suite State');
        syncedAging = true;
      }
      if (parsed?.itemSalesLatest?.items && Array.isArray(parsed.itemSalesLatest.items) && parsed.itemSalesLatest.items.length > 0) {
        ingestSalesTrendItems(parsed.itemSalesLatest.items, parsed.itemSalesPrevYear?.items || []);
        syncedTrends = true;
      }
      if (syncedAging && syncedTrends) return true;
    }

    // 2. Try window.PMG_PERFORMANCE_SAMPLE_DATA fallback if in demo/preloaded state
    if (typeof window !== 'undefined' && window.PMG_PERFORMANCE_SAMPLE_DATA) {
      const sample = window.PMG_PERFORMANCE_SAMPLE_DATA;
      if (!syncedAging && sample.stockAgingLatest?.items && Array.isArray(sample.stockAgingLatest.items)) {
        ingestStockAgingItems(sample.stockAgingLatest.items, 'Preloaded October 2026 Sample');
        syncedAging = true;
      }
      if (!syncedTrends && sample.itemSalesLatest?.items && Array.isArray(sample.itemSalesLatest.items)) {
        ingestSalesTrendItems(sample.itemSalesLatest.items, sample.itemSalesPrevYear?.items || []);
        syncedTrends = true;
      }
      if (syncedAging && syncedTrends) return true;
    }

    // 3. Try dedicated Stock Aging cache
    const rawAging = localStorage.getItem('pmg_stock_aging_cache_v1');
    if (rawAging && !syncedAging) {
      const parsed = JSON.parse(rawAging);
      if (Array.isArray(parsed) && parsed.length > 0) {
        ingestStockAgingItems(parsed, 'Stock Aging Cache');
        syncedAging = true;
      }
    }

    if (syncedAging || syncedTrends) return true;
  } catch (err) {
    console.warn('[Replenishment] Error syncing stock aging and trends from storage:', err);
  }
  updateAgingStatusUI();
  return false;
}

function ingestStockAgingItems(items, sourceName) {
  stockAgingMap.clear();
  let agedCount = 0;
  let totalAgedVal = 0;
  const baseCodeVariants = new Map(); // baseCode -> Map of uom -> record

  (items || []).forEach(it => {
    const meta = extractItemCodeAndUom(it.itemCode, it.uom);
    if (!meta.baseCode) return;
    const agedQty = (it.d150_180 || 0) + (it.d180_210 || 0) + (it.d210_240 || 0) +
                    (it.d240_270 || 0) + (it.d270_300 || 0) + (it.d300_330 || 0) +
                    (it.d330_360 || 0) + (it.above1Yr || 0);
    const cost = it.avgCost || it.averageCost || it.unitCost || 0;
    const agedValue = +(agedQty * cost).toFixed(2);
    const isAged = agedQty > 0;

    const record = {
      itemCode: meta.exactCode,
      baseCode: meta.baseCode,
      uom: meta.orderUom,
      compositeKey: meta.compositeKey,
      itemName: it.itemName || '',
      category: it.category || '',
      ohQty: it.ohQty || 0,
      avgCost: cost,
      agedQty,
      agedValue,
      isAged
    };

    // Index specifically by composite key `${baseCode}::${orderUom}` and exact code
    stockAgingMap.set(meta.compositeKey, record);
    stockAgingMap.set(meta.exactCode, record);

    if (!baseCodeVariants.has(meta.baseCode)) {
      baseCodeVariants.set(meta.baseCode, new Map());
    }
    baseCodeVariants.get(meta.baseCode).set(meta.orderUom, record);

    if (isAged) {
      agedCount++;
      totalAgedVal += agedValue;
    }
  });

  // Only assign bareCode if there is exactly 1 unique UOM variant for that item code in the catalog
  baseCodeVariants.forEach((uomMap, baseCode) => {
    if (uomMap.size === 1) {
      const singleRecord = uomMap.values().next().value;
      stockAgingMap.set(baseCode, singleRecord);
    }
  });

  stockAgingStatus = {
    connected: true,
    skuCount: stockAgingMap.size,
    agedCount,
    totalAgedValue: +totalAgedVal.toFixed(2),
    source: sourceName || 'Live Ingestion'
  };

  updateAgingStatusUI();
  if (inventoryData.length > 0) recalcInventory();
}

/**
 * Ingests multi-month sales comparisons by exact Item Code and UOM.
 * In Xilnex, sales velocity up/down trends are calculated specifically on that individual UOM
 * (e.g. 100133 - BOX vs 100133 - STRIP).
 */
function ingestSalesTrendItems(latestItems, prevItems) {
  skuSalesTrendMap.clear();
  const prevMap = new Map();

  (prevItems || []).forEach(it => {
    const meta = extractItemCodeAndUom(it.itemCode, it.uom);
    prevMap.set(meta.compositeKey, it);
    prevMap.set(meta.exactCode, it);
  });

  (latestItems || []).forEach(it => {
    const meta = extractItemCodeAndUom(it.itemCode, it.uom);
    const prev = prevMap.get(meta.compositeKey) || prevMap.get(meta.exactCode);
    const latestQty = parseFloat(it.qty !== undefined ? it.qty : it.salesQty) || 0;
    const prevQty = prev ? (parseFloat(prev.qty !== undefined ? prev.qty : prev.salesQty) || 0) : 0;

    const diffQty = latestQty - prevQty;
    const diffPct = prevQty > 0 ? ((latestQty - prevQty) / prevQty) * 100 : (latestQty > 0 ? 100 : 0);
    const direction = diffPct >= 10 ? 'UP' : (diffPct <= -10 ? 'DOWN' : 'FLAT');

    const record = {
      direction,
      momentumPct: +diffPct.toFixed(1),
      diffQty,
      latestQty,
      prevQty,
      uom: meta.orderUom,
      unconstrainedAds: prevQty > 0 ? +(prevQty / 30).toFixed(3) : 0,
      isZeroRecent: latestQty === 0
    };

    skuSalesTrendMap.set(meta.compositeKey, record);
    skuSalesTrendMap.set(meta.exactCode, record);
  });
}

function updateAgingStatusUI() {
  const pill = document.getElementById('invAgingStatusPill');
  const desc = document.getElementById('invAgingStatusDesc');
  if (!pill) return;

  if (stockAgingStatus.connected) {
    pill.className = 'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30';
    pill.textContent = `✓ Active (${stockAgingStatus.agedCount} Aged SKUs Monitored)`;
    if (desc) {
      desc.innerHTML = `Stock Aging interlock active (source: <b>${stockAgingStatus.source}</b>): <b>${stockAgingStatus.skuCount}</b> SKUs monitored (${stockAgingStatus.agedCount} aged &ge; 150d, RM ${stockAgingStatus.totalAgedValue.toLocaleString()}). Direct lock active until SOH &lt; 2 mo.`;
    }
  } else {
    pill.className = 'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/30';
    pill.textContent = '⚠ Standalone Mode (Upload Aging CSV to Interlock)';
    if (desc) {
      desc.textContent = 'Upload [Admin] Aging CSV or sync from Performance Suite to enforce Rule 1 (direct lock on aging stock until < 2 mo cover).';
    }
  }
}

async function handleAgingFileUpload(file) {
  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    let headerIdx = -1;
    for (let i = 0; i < Math.min(lines.length, 30); i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes('item code') && lower.includes('category') && (lower.includes('150-180') || lower.includes('oh qty'))) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) {
      alert('Could not locate Aging header in uploaded file. Please ensure it is a Xilnex [Admin] Aging export.');
      return;
    }

    const items = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const parseResult = Papa.parse(lines[i]);
      const cols = (parseResult && parseResult.data && parseResult.data[0]) || [];
      const code = (cols[0] || '').trim();
      if (!code || code.toLowerCase() === 'grand total') continue;
      const itemName = (cols[1] || '').trim();
      const category = (cols[2] || '').trim();
      const parseNum = v => parseFloat(String(v || '').replace(/[^0-9.-]/g, '')) || 0;
      const ohQty = parseNum(cols[3]);
      const avgCost = parseNum(cols[4]);
      const d150_180 = parseNum(cols[5]);
      const d180_210 = parseNum(cols[6]);
      const d210_240 = parseNum(cols[7]);
      const d240_270 = parseNum(cols[8]);
      const d270_300 = parseNum(cols[9]);
      const d300_330 = parseNum(cols[10]);
      const d330_360 = parseNum(cols[11]);
      const above1Yr = parseNum(cols[12]);

      items.push({
        itemCode: code, itemName, category, ohQty, avgCost,
        d150_180, d180_210, d210_240, d240_270, d270_300, d300_330, d330_360, above1Yr
      });
    }

    try {
      localStorage.setItem('pmg_stock_aging_cache_v1', JSON.stringify(items));
    } catch(e) {}

    ingestStockAgingItems(items, file.name);
    alert(`✓ Successfully loaded Stock Aging report (${items.length} SKUs). Replenishment engine now locked to aging guidelines.`);
  } catch(err) {
    alert('Failed to parse Aging file: ' + err.message);
  }
}

/**
 * Retrieves stock aging record disambiguated specifically by Item Code and UOM.
 * Prevents "100133 - STRIP" aging from locking out "100133 - BOX".
 */
function getStockAgingForItem(itemCode, uom) {
  const meta = extractItemCodeAndUom(itemCode, uom);
  // 1. Specific composite key e.g. "100133::STRIP"
  if (stockAgingMap.has(meta.compositeKey)) return stockAgingMap.get(meta.compositeKey);
  // 2. Exact code e.g. "100133 - STRIP"
  if (stockAgingMap.has(meta.exactCode)) return stockAgingMap.get(meta.exactCode);
  // 3. Alternative formatted dash key
  const altDash = `${meta.baseCode} - ${meta.orderUom}`;
  if (stockAgingMap.has(altDash)) return stockAgingMap.get(altDash);
  // 4. Fallback to bare baseCode only if non-conflicting
  if (stockAgingMap.has(meta.baseCode)) {
    const rec = stockAgingMap.get(meta.baseCode);
    if (!rec.uom || rec.uom === meta.orderUom || rec.uom === 'PCS') {
      return rec;
    }
  }
  return null;
}

// ─── MULTI-MONTH SALES TREND & MOMENTUM DETECTOR ─────────────────────────────
/**
 * Detects sales momentum and direction specifically for the SKU's Order UOM.
 */
function detectItemSalesTrend(row, baselineAds, rowUom) {
  const code = String(resolveCol(row, ['Item Code', 'Item_Code', 'ItemCode', 'SKU', 'Code'])).trim().toUpperCase();
  const meta = extractItemCodeAndUom(code, rowUom);

  // 1. Check if row itself has month columns (e.g. Month 1, Month 2, Latest, M-1, M-2)
  const m2 = parseFloat(resolveCol(row, ['Sales_M2', 'Month 2 Qty', 'Qty_M2', 'M-2 Qty', 'Month2'])) || 0;
  const m1 = parseFloat(resolveCol(row, ['Sales_M1', 'Month 1 Qty', 'Qty_M1', 'M-1 Qty', 'Month1'])) || 0;
  const mLatest = parseFloat(resolveCol(row, ['Sales_Latest', 'Latest Qty', 'Qty_Latest', 'Current Month Qty'])) || 0;

  if (m1 > 0 || mLatest > 0) {
    const prior = m1 || m2 || 1;
    const diffPct = ((mLatest - prior) / prior) * 100;
    return {
      direction: diffPct >= 10 ? 'UP' : (diffPct <= -10 ? 'DOWN' : 'FLAT'),
      momentumPct: diffPct,
      unconstrainedAds: prior > 0 ? (prior / 30) : baselineAds,
      isZeroRecent: mLatest === 0,
      uom: meta.orderUom
    };
  }

  // 2. Check storage/suite trend cache using exact composite key first!
  if (skuSalesTrendMap.has(meta.compositeKey)) return skuSalesTrendMap.get(meta.compositeKey);
  if (skuSalesTrendMap.has(meta.exactCode)) return skuSalesTrendMap.get(meta.exactCode);
  const altDash = `${meta.baseCode} - ${meta.orderUom}`;
  if (skuSalesTrendMap.has(altDash)) return skuSalesTrendMap.get(altDash);

  // 3. Fallback: evaluate single salesQty & SOH
  const salesQty = parseFloat(resolveCol(row, ['Sales Qty', 'Sales_Qty_90d', 'SalesQty', 'Qty Sold', 'Sales', 'Qty_Sold'])) || 0;
  const soh = parseFloat(resolveCol(row, ['Quantity On Hand', 'SOH', 'Stock on Hand', 'StockOnHand'])) || 0;

  if (salesQty === 0) {
    return {
      direction: 'ZERO',
      momentumPct: -100,
      unconstrainedAds: 0.5,
      isZeroRecent: true,
      uom: meta.orderUom
    };
  }

  return {
    direction: 'FLAT',
    momentumPct: 0,
    unconstrainedAds: baselineAds,
    isZeroRecent: false,
    uom: meta.orderUom
  };
}

// ─── PARAMETERS (user-editable) ──────────────────────────────────────────────
function getParams() {
  return {
    salesWindow: parseInt(document.getElementById('paramSalesWindow')?.value, 10) || 90,
    leadTime:    parseInt(document.getElementById('paramLeadTime')?.value,    10) || 7,
    safetyDays:  parseInt(document.getElementById('paramSafetyDays')?.value,  10) || 30,
    targetDays:  parseInt(document.getElementById('paramTargetDays')?.value,  10) || 60, // HQ Standard: 2.0 months (60 days buffer)
  };
}

// ─── INIT DROP ZONE ───────────────────────────────────────────────────────────
function initInventory() {
  const dropZone  = document.getElementById('invDropZone');
  const fileInput = document.getElementById('invFileInput');
  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    if (e.target.files.length) handleInventoryFile(e.target.files[0]);
  });
  dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleInventoryFile(e.dataTransfer.files[0]);
  });

  const agingInput = document.getElementById('invAgingFileInput');
  if (agingInput) {
    agingInput.addEventListener('change', e => {
      if (e.target.files.length) handleAgingFileUpload(e.target.files[0]);
    });
  }

  // Auto-sync Stock Aging from Performance Suite / LocalStorage on startup
  syncStockAgingFromStorage();

  ['paramSalesWindow','paramLeadTime','paramSafetyDays','paramTargetDays'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => { if (inventoryData.length) recalcInventory(); });
  });

  const searchEl = document.getElementById('invSearch');
  if (searchEl) searchEl.addEventListener('input', renderInventoryGrid);

  const vendorFilterEl = document.getElementById('invVendorFilter');
  if (vendorFilterEl) vendorFilterEl.addEventListener('change', renderInventoryGrid);

  const filterToggle = document.getElementById('invFilterReorder');
  if (filterToggle) filterToggle.addEventListener('change', renderInventoryGrid);

  const tryOutBtn = document.getElementById('invDownloadTryOutBtn');
  if (tryOutBtn) tryOutBtn.addEventListener('click', downloadTryOutCsv);

  const dlBtn = document.getElementById('invDownloadBtn');
  if (dlBtn) dlBtn.addEventListener('click', generatePOZip);
}

// ─── FILE PARSING ─────────────────────────────────────────────────────────────
async function handleInventoryFile(file) {
  const statusEl = document.getElementById('invStatus');
  if (statusEl) { statusEl.textContent = `Reading & scanning ${file.name}…`; statusEl.className = 'text-blue-600 text-sm mt-2'; }

  try {
    let text = await file.text();
    // Strip UTF-8 BOM if present
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }

    // Split lines and locate the actual header row (skipping @@##Write Time or comment headers)
    const rawLines = text.split(/\r?\n/);
    let headerIdx = 0;
    for (let i = 0; i < Math.min(rawLines.length, 30); i++) {
      const lineTrim = rawLines[i].trim();
      const lineLower = lineTrim.toLowerCase();
      // Skip metadata or comment lines starting with @@, ##, or //
      if (lineTrim.startsWith('@@') || lineTrim.startsWith('##') || lineTrim.startsWith('//')) {
        continue;
      }
      // Check if line contains essential Xilnex / standard inventory headers
      if ((lineLower.includes('item code') || lineLower.includes('item name') || lineLower.includes('stocktype') || lineLower.includes('preferred vendor') || lineLower.includes('quantity on hand')) && rawLines[i].includes(',')) {
        headerIdx = i;
        break;
      }
    }

    const cleanCsvText = headerIdx > 0 ? rawLines.slice(headerIdx).join('\r\n') : text;

    Papa.parse(cleanCsvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete(results) {
        if (!results.data || results.data.length === 0) {
          if (statusEl) statusEl.textContent = 'Error: CSV appears empty.';
          return;
        }

        // Keep rows that have an Item Code or Item Name, skipping any accidental repeated headers
        inventoryData = results.data.filter(r => {
          const code = resolveCol(r, ['Item Code', 'Item_Code', 'ItemCode', 'SKU', 'itemcode', 'Code']).trim();
          const name = resolveCol(r, ['Item Name', 'Item Description', 'Description', 'Desc', 'Name']).trim();
          if (!code && !name) return false;
          if (code.toLowerCase() === 'item code' || name.toLowerCase() === 'item name') return false;
          return true;
        });

        recalcInventory();
        populateVendorDropdown();
        if (statusEl) {
          statusEl.textContent = `✓ Successfully processed ${inventoryGrid.length} inventory items from ${file.name}`;
          statusEl.className = 'text-green-600 font-semibold text-sm mt-2';
        }
      },
      error(err) {
        if (statusEl) {
          statusEl.textContent = `Parse error: ${err.message}`;
          statusEl.className = 'text-red-600 text-sm mt-2';
        }
      }
    });
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = `File read error: ${err.message}`;
      statusEl.className = 'text-red-600 text-sm mt-2';
    }
  }
}

// ─── COLUMN RESOLVER ─────────────────────────────────────────────────────────
function resolveCol(row, candidates) {
  for (const key of Object.keys(row)) {
    if (candidates.some(c => key.trim().toLowerCase() === c.toLowerCase())) return row[key];
  }
  return '';
}

// ─── CSV ESCAPE (RFC 4180) ──────────────────────────────────────────────────
function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// ─── SSJ PHARMA & VENDOR HELPERS ──────────────────────────────────────────
function isSSJPharmaVendor(vendorCode) {
  if (!vendorCode) return false;
  return vendorCode.trim().toUpperCase().includes('SSJ PHARMA');
}

function getOrderGroup(vendorCode, nonFunctionalField1) {
  if (isSSJPharmaVendor(vendorCode)) {
    const nff = (nonFunctionalField1 || '').trim();
    if (nff && nff !== '-') {
      return `${vendorCode} - ${nff}`;
    }
    return `${vendorCode} - OTHER`;
  }
  return vendorCode;
}

function cleanFileName(name) {
  return String(name || '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

function chunkRows(rows, maxSkus) {
  if (!maxSkus || maxSkus <= 0 || rows.length <= maxSkus) {
    return [rows];
  }
  const chunks = [];
  for (let i = 0; i < rows.length; i += maxSkus) {
    chunks.push(rows.slice(i, i + maxSkus));
  }
  return chunks;
}

function showDownloadSuccess(btnId, msg) {
  const btn = document.getElementById(btnId);
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-circle-check mr-2"></i>${msg}`;
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 3500);
  }
}

// ─── CALCULATION ENGINE (SMART REPLENISHMENT RULES 1, 2, 3) ───────────────────
function recalcInventory() {
  const p = getParams();

  // Try to sync aging data if not yet loaded
  if (stockAgingMap.size === 0) {
    syncStockAgingFromStorage();
  }

  // Cross-reference with near-expiry stock from all branches (< 12 months)
  const shortDatedMap = (typeof getShortDatedStockForReplenishment === 'function')
    ? getShortDatedStockForReplenishment(12)
    : {};
  let totalClearanceOffersCount = 0;

  inventoryGrid = inventoryData
    .filter(row => Object.values(row).some(v => v && String(v).trim()))
    .map((row, idx) => {
      const itemCode   = resolveCol(row, ['Item Code','Item_Code','ItemCode','item code','SKU','Code','Item']) || `ITEM${idx+1}`;
      const desc       = resolveCol(row, ['Item Name','Item Description','Description','Desc','Name','Product Name']) || '';
      let vendorCode   = resolveCol(row, ['Preferred Vendor','Vendor_Code','VendorCode','Vendor','Supplier','Supp Code','Supplier Code']).trim();
      if (!vendorCode || vendorCode === '-') vendorCode = 'UNASSIGNED';
      const nonFunctionalField1 = (resolveCol(row, ['Non Functional Field 1', 'NonFunctionalField1', 'Non_Functional_Field_1', 'Non Functional 1', 'Field 1', 'NFF1']) || '').trim();
      const orderGroup = getOrderGroup(vendorCode, nonFunctionalField1);

      const rawUom     = resolveCol(row, ['UOM','Unit','Unit of Measure','Uom']);
      const itemUomMeta = extractItemCodeAndUom(itemCode, rawUom);
      const uom        = itemUomMeta.orderUom;
      const salesQty   = parseFloat(resolveCol(row, ['Sales Qty','Sales_Qty_90d','SalesQty','Qty Sold','Sales','Qty_Sold'])) || 0;
      const soh        = parseFloat(resolveCol(row, ['Quantity On Hand','SOH','Stock on Hand','StockOnHand','Closing Stock','Balance','Qty Balance'])) || 0;
      const onOrder    = parseFloat(resolveCol(row, ['In Order Quantity','On_Order','OnOrder','Pending PO','In Transit','Order Qty','Pending_PO'])) || 0;
      const activeVal  = resolveCol(row, ['Active','Status','IsActive']).trim().toLowerCase();
      const isActive   = activeVal !== 'no' && activeVal !== 'false';
      const category   = resolveCol(row, ['Category', 'Cat', 'Item Category', 'Division']).trim().toUpperCase();

      // Packaging Specification & UOM parsed from Item Code suffix (e.g. - box30, - pack10, - twinpack, - sac)
      const packSpec = parsePackagingSpecification(itemCode);

      // Baseline ADS
      const baselineAds = salesQty > 0 ? (salesQty / p.salesWindow) : 0;
      let effectiveAds = baselineAds;
      const ip = soh + onOrder;
      const targetDaysHQ = Math.min(p.targetDays, 60); // HQ standard 2.0 months buffer maximum

      // Margin Tier Buffer Adjustment
      let targetDays = targetDaysHQ;
      const descUpper = desc.toUpperCase();
      if (category === 'SUPPLEME' || descUpper.includes('NUTRI') || descUpper.includes('LIVEMORE') || descUpper.includes('JH NUTRITION')) {
        targetDays = Math.min(65, p.targetDays + 5); // +5 days buffer on high-margin anchors
      } else if (descUpper.includes('ENSURE GOLD') || descUpper.includes('ENERCAL') || descUpper.includes('NUTREN GLUCO')) {
        targetDays = 30; // Strict JIT 30 days max on low/negative margin commercial milk tins
      }

      // Detect Sales Trend & Momentum specifically by Order UOM
      const trend = detectItemSalesTrend(row, baselineAds, uom);

      // Smart replenishment diagnostic variables
      let suggestedOrder = 0;
      let ruleApplied = 'STANDARD_ROP';
      let badge = '✓ NORMAL ROP';
      let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
      let reason = `Steady historical replenishment rate (${uom}).`;
      let isAgingLocked = false;
      let isOverridden = false;

      // ─── RULE 1: STOCK AGING DIRECT LOCK ──────────────────────────────────
      // Any SKU appearing in stock aging is directly locked away until quantity drops under 2 months from selling (< 60 days)
      const agingInfo = getStockAgingForItem(itemCode, uom);
      if (agingInfo && agingInfo.isAged && agingInfo.agedQty > 0) {
        const daysCover = baselineAds > 0 ? (soh / baselineAds) : 9999;
        const monthsCover = daysCover / 30;

        if (monthsCover >= 2.0 || baselineAds === 0) {
          // DIRECT LOCK AWAY: Do not order until stock is depleted under 2 months
          suggestedOrder = 0;
          ruleApplied = 'RULE_1_AGING_LOCKED';
          badge = '🛑 AGING LOCKED';
          badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
          reason = `Aging stock detected (${agingInfo.agedQty} ${uom} ≥150d, RM ${agingInfo.agedValue}). Existing SOH covers ${monthsCover >= 999 ? '∞' : monthsCover.toFixed(1) + ' mo'} (≥ 2.0 mo target). Strictly locked from ordering until stock is depleted under 2 months.`;
          isAgingLocked = true;
        } else {
          // Stock has depleted to LESS than 2 months! Allow conservative replenishment up to 2.0 months target
          const rop = baselineAds * (p.leadTime + p.safetyDays);
          const targetMax = baselineAds * targetDays;
          suggestedOrder = (ip <= rop && baselineAds > 0 && isActive) ? Math.ceil(targetMax - ip) : 0;
          ruleApplied = 'RULE_1_AGING_DEPLETED';
          badge = '🟡 AGING DEPLETED (< 2 Mo)';
          badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
          reason = `Aged stock depleted to ${monthsCover.toFixed(1)} mo (< 2.0 mo target). Reordering conservatively up to 2 months limit (${uom}).`;
        }
      }

      // If not aging-locked, evaluate Rule 2 and Rule 3
      if (!isAgingLocked) {
        // ─── RULE 2: SALES MOMENTUM UPWARD ACCELERATION ─────────────────────
        if (trend.direction === 'UP' && trend.momentumPct >= 10) {
          // Cap momentum multiplier between +5% and +35% to prevent runaway over-ordering
          const momentumMultiplier = Math.min(1.35, 1 + (trend.momentumPct / 100) * 0.5);
          effectiveAds = baselineAds * momentumMultiplier;
          const rop = effectiveAds * (p.leadTime + p.safetyDays);
          const targetMax = effectiveAds * targetDays;
          suggestedOrder = (ip <= rop && effectiveAds > 0 && isActive) ? Math.ceil(targetMax - ip) : 0;
          ruleApplied = 'RULE_2_MOMENTUM_BOOST';
          badge = `🚀 MOMENTUM UP (+${Math.round(trend.momentumPct)}%)`;
          badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
          reason = `Sales accelerating (+${Math.round(trend.momentumPct)}% MoM on ${uom}). ADS adjusted from ${baselineAds.toFixed(2)} to ${effectiveAds.toFixed(2)} ${uom}/day to prevent fast-mover stockouts.`;
        }
        // ─── RULE 3: SMART STOCKOUT (PHANTOM DROP) VS TRUE CONTRACTION ───────
        else if (trend.direction === 'DOWN' || baselineAds === 0 || trend.isZeroRecent) {
          if (soh <= 0) {
            // RULE 3A: PHANTOM DROP / OOS MISSED ORDERING
            // Demand did not vanish; shelf was empty!
            effectiveAds = Math.max(trend.unconstrainedAds || 0, baselineAds, 0.5);
            const rop = effectiveAds * (p.leadTime + p.safetyDays);
            const targetMax = effectiveAds * targetDays;
            suggestedOrder = (ip <= rop && isActive) ? Math.ceil(targetMax - ip) : 0;
            ruleApplied = 'RULE_3A_PHANTOM_DROP';
            badge = '⚠️ OOS PHANTOM DROP';
            badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
            reason = `Sales dropped to 0 due to zero shelf stock (stockout), not loss of demand. Restoring baseline replenishment rate (${uom}).`;
          } else {
            // RULE 3B: TRUE CONTRACTION (Stock was available, but demand fell)
            const decayedAds = Math.max(0.01, baselineAds * Math.max(0.4, 1 - Math.abs(trend.momentumPct || 25) / 100));
            const daysCoverWithSoh = decayedAds > 0 ? Math.round(soh / decayedAds) : 9999;

            if (daysCoverWithSoh >= targetDaysHQ) {
              // SOH covers >= 60 days HQ standard
              suggestedOrder = 0;
              ruleApplied = 'RULE_3B_SURPLUS_HALT';
              badge = '⏸️ SURPLUS (SOH ≥ 2 Mo)';
              badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
              reason = `Demand softened. Existing SOH (${soh} ${uom}) covers ${daysCoverWithSoh} days (≥ 60d target). Reorder halted.`;
              effectiveAds = decayedAds;
            } else {
              effectiveAds = decayedAds;
              const rop = effectiveAds * (p.leadTime + p.safetyDays);
              const targetMax = effectiveAds * targetDays;
              suggestedOrder = (ip <= rop && effectiveAds > 0 && isActive) ? Math.ceil(targetMax - ip) : 0;
              ruleApplied = 'RULE_3B_DECAYING_ORDER';
              badge = `📉 DECAYING DEMAND (-${Math.round(Math.abs(trend.momentumPct || 25))}%)`;
              badgeColor = 'bg-purple-100 text-purple-800 border-purple-300';
              reason = `Demand softened with stock on shelf. Reordering conservatively at decayed run-rate (${decayedAds.toFixed(2)} ${uom}/day).`;
            }
          }
        }
        // ─── STANDARD ROP ────────────────────────────────────────────────────
        else {
          const rop = effectiveAds * (p.leadTime + p.safetyDays);
          const targetMax = effectiveAds * targetDays;
          suggestedOrder = (ip <= rop && effectiveAds > 0 && isActive) ? Math.ceil(targetMax - ip) : 0;
        }
      }

      // In Xilnex, the row quantity is already measured in the SKU's specific unit (e.g. boxes, twinpacks, packs, sachets).
      // We do NOT artificially multiply suggestedOrder by packSize (e.g. 7 boxes remains 7 boxes).
      suggestedOrder = Math.max(0, Math.ceil(suggestedOrder));

      const ropFinal = effectiveAds * (p.leadTime + p.safetyDays);
      const daysCover = effectiveAds > 0 ? Math.round(soh / effectiveAds) : 9999;

      // Match clearance offers from sister branches
      const cleanCode = String(itemCode || '').trim().toUpperCase();
      const clearanceOffers = shortDatedMap[cleanCode] || [];
      if (clearanceOffers.length > 0 && suggestedOrder > 0) {
        totalClearanceOffersCount++;
      }

      return {
        itemCode, desc, vendorCode, nonFunctionalField1, orderGroup, uom, isActive, category,
        salesQty, soh, onOrder,
        packSize: packSpec.smallestUomUnits,
        smallestUomUnits: packSpec.smallestUomUnits,
        packLabel: packSpec.label,
        packDisplayTag: packSpec.displayTag,
        unitType: packSpec.unitType,
        ads: +effectiveAds.toFixed(3),
        baselineAds: +baselineAds.toFixed(3),
        ip,
        rop: +ropFinal.toFixed(1),
        targetDays,
        targetMax: +(effectiveAds * targetDays).toFixed(1),
        suggestedOrder: Math.max(0, suggestedOrder),
        daysCover: Math.min(daysCover, 9999),
        approvedQty: Math.max(0, suggestedOrder),
        ruleApplied,
        badge,
        badgeColor,
        reason,
        isAgingLocked,
        isOverridden: false,
        clearanceOffers,
        transferredQty: 0,
        transferredFrom: ''
      };
    });

  // Update clearance alert banner
  const alertBanner = document.getElementById('invClearanceAlertBanner');
  const countBadge  = document.getElementById('invClearanceCountBadge');
  if (alertBanner) {
    if (totalClearanceOffersCount > 0) {
      alertBanner.classList.remove('hidden');
      if (countBadge) countBadge.textContent = `${totalClearanceOffersCount} SKUs to Clear`;
    } else {
      alertBanner.classList.add('hidden');
    }
  }

  populateVendorDropdown();
  renderInventoryGrid();
  updateInventoryKPIs();

  const panelEl = document.getElementById('invResultPanel');
  if (panelEl) panelEl.classList.remove('hidden');
}

// ─── POPULATE VENDOR DROPDOWN ────────────────────────────────────────────────
function populateVendorDropdown() {
  const select = document.getElementById('invVendorFilter');
  if (!select) return;
  const currentVal = select.value;

  const vendorMap = {};
  const ssjSubGroups = {};

  inventoryGrid.forEach(r => {
    const vc = r.vendorCode || 'UNASSIGNED';
    if (!vendorMap[vc]) vendorMap[vc] = { total: 0, toOrder: 0 };
    vendorMap[vc].total++;
    if (r.approvedQty > 0) vendorMap[vc].toOrder++;

    if (isSSJPharmaVendor(vc)) {
      const gk = r.orderGroup;
      if (!ssjSubGroups[gk]) ssjSubGroups[gk] = { total: 0, toOrder: 0 };
      ssjSubGroups[gk].total++;
      if (r.approvedQty > 0) ssjSubGroups[gk].toOrder++;
    }
  });

  const sortedVendors = Object.keys(vendorMap).sort((a, b) => {
    if (vendorMap[b].toOrder !== vendorMap[a].toOrder) {
      return vendorMap[b].toOrder - vendorMap[a].toOrder;
    }
    return a.localeCompare(b);
  });

  let optionsHtml = `<option value="">All Preferred Vendors (${sortedVendors.length} vendors)</option>`;

  sortedVendors.forEach(v => {
    const count = vendorMap[v].toOrder;
    if (isSSJPharmaVendor(v)) {
      optionsHtml += `<option value="${escHtml(v)}">${escHtml(v)} (ALL - ${count} to order)</option>`;
      const sortedSubs = Object.keys(ssjSubGroups).sort((a, b) => a.localeCompare(b));
      sortedSubs.forEach(sg => {
        const subCount = ssjSubGroups[sg].toOrder;
        optionsHtml += `<option value="${escHtml(sg)}">&nbsp;&nbsp;&nbsp;&nbsp;↳ ${escHtml(sg)} (${subCount} to order)</option>`;
      });
    } else {
      optionsHtml += `<option value="${escHtml(v)}">${escHtml(v)} (${count} to order)</option>`;
    }
  });

  select.innerHTML = optionsHtml;

  if (currentVal && (sortedVendors.includes(currentVal) || ssjSubGroups[currentVal])) {
    select.value = currentVal;
  }
}

// ─── KPI COUNTERS ────────────────────────────────────────────────────────────
function updateInventoryKPIs() {
  const totalSKUs   = inventoryGrid.length;
  const toReorder   = inventoryGrid.filter(r => r.suggestedOrder > 0).length;
  const totalUnits  = inventoryGrid.reduce((s, r) => s + (r.approvedQty || 0), 0);
  const agingLocked = inventoryGrid.filter(r => r.ruleApplied === 'RULE_1_AGING_LOCKED').length;
  const momentum    = inventoryGrid.filter(r => r.ruleApplied === 'RULE_2_MOMENTUM_BOOST').length;
  const stockout    = inventoryGrid.filter(r => r.ruleApplied === 'RULE_3A_PHANTOM_DROP').length;

  setText('kpiTotalSKUs',   totalSKUs);
  setText('kpiToReorder',   toReorder);
  setText('kpiTotalUnits',  totalUnits);
  setText('kpiAgingLocked', agingLocked);
  setText('kpiMomentum',    momentum);
  setText('kpiStockout',    stockout);

  // Update filter pill counts if present
  setText('pillCountAll', totalSKUs);
  setText('pillCountReorder', toReorder);
  setText('pillCountAging', agingLocked);
  setText('pillCountMomentum', momentum);
  setText('pillCountStockout', stockout);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setInvFilterPill(pillType) {
  invActiveFilterPill = pillType;
  document.querySelectorAll('.inv-filter-pill').forEach(btn => {
    if (btn.dataset.pill === pillType) {
      btn.classList.add('bg-blue-600', 'text-white', 'shadow-xs');
      btn.classList.remove('bg-white', 'text-slate-700', 'hover:bg-slate-100');
    } else {
      btn.classList.remove('bg-blue-600', 'text-white', 'shadow-xs');
      btn.classList.add('bg-white', 'text-slate-700', 'hover:bg-slate-100');
    }
  });
  renderInventoryGrid();
}

function overrideAgingLock(rowIdx) {
  const row = inventoryGrid[rowIdx];
  if (!row) return;

  const inputVal = prompt(
    `[PHARMACIST OVERRIDE - STOCK AGING LOCK]\n\nSKU: ${row.itemCode} - ${row.desc}\nOrder UOM: ${row.uom}\nCurrent SOH: ${row.soh} ${row.uom}\nAged Qty: ${row.isAgingLocked ? 'Locked' : 'Depleted'}\n\nEnter approved order quantity in ${row.uom} to override lock:`,
    row.packSize > 1 ? String(row.packSize) : '10'
  );

  if (inputVal !== null) {
    const qty = parseInt(inputVal, 10);
    if (!isNaN(qty) && qty >= 0) {
      row.approvedQty = qty;
      row.isOverridden = true;
      row.badge = `⚠️ OVERRIDE (${qty} ${row.uom})`;
      row.badgeColor = 'bg-amber-200 text-amber-950 border-amber-400';
      row.reason = `Pharmacist manual override applied. Approved: ${qty} ${row.uom}.`;
      updateInventoryKPIs();
      renderInventoryGrid();
    }
  }
}

// ─── GRID RENDER ─────────────────────────────────────────────────────────────
function renderInventoryGrid() {
  const tbody = document.getElementById('invTableBody');
  if (!tbody) return;

  const searchQ        = (document.getElementById('invSearch')?.value || '').toLowerCase();
  const selectedVendor = document.getElementById('invVendorFilter')?.value || '';
  const onlyReorder    = document.getElementById('invFilterReorder')?.checked || false;

  const filtered = inventoryGrid.filter(row => {
    if (selectedVendor) {
      if (row.vendorCode !== selectedVendor && row.orderGroup !== selectedVendor) {
        return false;
      }
    }
    if (onlyReorder && row.approvedQty === 0 && row.suggestedOrder === 0) return false;
    if (searchQ && !row.itemCode.toLowerCase().includes(searchQ) && !row.desc.toLowerCase().includes(searchQ)) return false;

    // Filter pill logic
    if (invActiveFilterPill === 'REORDER' && row.approvedQty === 0 && row.suggestedOrder === 0) return false;
    if (invActiveFilterPill === 'MOMENTUM' && row.ruleApplied !== 'RULE_2_MOMENTUM_BOOST') return false;
    if (invActiveFilterPill === 'STOCKOUT' && row.ruleApplied !== 'RULE_3A_PHANTOM_DROP') return false;
    if (invActiveFilterPill === 'AGING_LOCKED' && row.ruleApplied !== 'RULE_1_AGING_LOCKED') return false;
    if (invActiveFilterPill === 'SURPLUS' && row.ruleApplied !== 'RULE_3B_SURPLUS_HALT') return false;

    return true;
  });

  tbody.innerHTML = filtered.map((row) => {
    const origIdx = inventoryGrid.indexOf(row);
    const coverClass   = row.daysCover < 14 ? 'text-red-600 font-bold'
                       : row.daysCover < 30 ? 'text-amber-600 font-semibold'
                       : 'text-green-700';
    const coverDisplay = row.daysCover >= 9999 ? '∞' : row.daysCover + 'd';
    const needReorder  = row.suggestedOrder > 0;
    const isSSJ        = isSSJPharmaVendor(row.vendorCode);

    return `<tr class="${origIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50/60 border-b border-gray-100 transition">
      <!-- Col 1: Item Code & Pack -->
      <td class="px-3 py-2 text-xs font-mono text-gray-700">
        <div class="font-bold text-gray-900">${escHtml(row.itemCode)}</div>
        <div class="mt-0.5 inline-flex items-center gap-1">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold ${row.packSize > 1 ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-slate-100 text-slate-600'}" title="Outer Pack Size: ${row.packSize} pcs">
            📦 ${escHtml(row.packLabel)}
          </span>
          ${row.category ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">${escHtml(row.category)}</span>` : ''}
        </div>
      </td>

      <!-- Col 2: Order UOM -->
      <td class="px-3 py-2 text-xs text-center">
        <span class="px-2 py-0.5 rounded font-black text-xs bg-blue-100 text-blue-900 border border-blue-300 shadow-xs" title="Official Ordering UOM: ${escHtml(row.uom)}">
          ${escHtml(row.uom)}
        </span>
      </td>

      <!-- Col 3: Description & Diagnostics -->
      <td class="px-3 py-2 text-xs text-gray-800 max-w-sm" title="${escHtml(row.desc)}">
        <div class="font-medium text-slate-900 leading-snug">${escHtml(row.desc)}</div>
        <div class="mt-1 flex items-center gap-1.5 flex-wrap">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${row.badgeColor}" title="${escHtml(row.reason)}">
            ${row.badge}
          </span>
          ${row.isAgingLocked ? `
            <button type="button" onclick="overrideAgingLock(${origIdx})" class="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer" title="Unlock for exceptional customer orders">
              Override Lock
            </button>
          ` : ''}
        </div>
        ${row.clearanceOffers && row.clearanceOffers.length > 0 ? `
          <div class="mt-1.5 flex flex-col gap-1">
            ${row.clearanceOffers.map(off => `
              <div class="flex items-center justify-between gap-2 p-1 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-900">
                <span>
                  ⚡ <b class="text-amber-950 font-bold">${escHtml(off.branch)}</b> has <b>${off.quantity} ${escHtml(row.uom)}</b> (Exp: ${off.expiryDate}, ${off.horizonLabel})
                </span>
                ${row.transferredQty > 0 && row.transferredFrom === off.branch ? `
                  <div class="flex items-center gap-1">
                    <span class="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">✓ Transferring ${row.transferredQty} ${escHtml(row.uom)}</span>
                    <button type="button" onclick="cancelClearanceTransfer(${origIdx})" class="text-rose-600 hover:underline font-semibold ml-1">Cancel</button>
                  </div>
                ` : `
                  <button type="button" onclick="applyClearanceTransfer(${origIdx}, '${escHtml(off.branch)}', ${off.quantity}, '${off.expiryDate}', '${escHtml(off.batchNumber || 'N/A')}')"
                    class="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-0.5 rounded text-[10px] transition shadow-xs shrink-0"
                    title="Transfer short-dated stock from sister branch instead of ordering new stock">
                    🤝 Help Clear (${Math.min(row.approvedQty || row.suggestedOrder, off.quantity)})
                  </button>
                `}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </td>

      <!-- Col 4: Vendor -->
      <td class="px-3 py-2 text-xs text-center text-gray-600">
        <div class="truncate max-w-[140px] mx-auto font-medium" title="${escHtml(row.vendorCode)}">${escHtml(row.vendorCode)}</div>
        ${row.nonFunctionalField1 ? `<span class="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${isSSJ ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 text-gray-600'}">${escHtml(row.nonFunctionalField1)}</span>` : ''}
      </td>

      <!-- Col 5: SOH -->
      <td class="px-3 py-2 text-xs text-right font-medium text-slate-800">
        <div>${row.soh}</div>
        <div class="text-[9px] text-gray-400 font-medium">${escHtml(row.uom)}</div>
      </td>

      <!-- Col 6: On Order -->
      <td class="px-3 py-2 text-xs text-right text-gray-500">
        <div>${row.onOrder}</div>
        <div class="text-[9px] text-gray-400">${escHtml(row.uom)}</div>
      </td>

      <!-- Col 7: ADS -->
      <td class="px-3 py-2 text-xs text-right text-gray-700" title="Baseline ADS: ${row.baselineAds}">
        <div class="font-bold">${row.ads}</div>
        <div class="text-[9px] text-gray-400 font-normal">${escHtml(row.uom)}/d</div>
        ${row.ruleApplied === 'RULE_2_MOMENTUM_BOOST' ? '<span class="text-[9px] text-emerald-600 font-bold">▲ Boosted</span>' : ''}
      </td>

      <!-- Col 8: Days Cover -->
      <td class="px-3 py-2 text-xs text-right ${coverClass}">${coverDisplay}</td>

      <!-- Col 9: ROP -->
      <td class="px-3 py-2 text-xs text-right text-gray-500">
        <div>${Math.round(row.rop)}</div>
        <div class="text-[9px] text-gray-400">${escHtml(row.uom)}</div>
      </td>

      <!-- Col 10: Suggested Qty -->
      <td class="px-3 py-2 text-xs text-right font-extrabold ${needReorder ? 'text-blue-700' : 'text-gray-300'}">
        <div class="text-sm font-black">${row.suggestedOrder || '–'}</div>
        <div class="text-[10px] text-blue-700 font-bold">${row.suggestedOrder ? escHtml(row.uom) : ''}</div>
        ${row.packRoundingNote ? `<div class="text-[9px] text-indigo-600 font-normal truncate max-w-[90px]" title="${escHtml(row.packRoundingNote)}">📦 MOQ Pack</div>` : ''}
      </td>

      <!-- Col 11: Approved Qty ✏️ -->
      <td class="px-3 py-2 text-xs text-center">
        <div class="inline-flex items-center justify-center gap-1">
          <input type="number" min="0" value="${row.approvedQty}"
            class="w-20 border ${row.isAgingLocked ? 'border-rose-300 bg-rose-50/50 text-rose-900' : 'border-gray-300 bg-white text-gray-900'} rounded px-1 py-0.5 text-center text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 font-bold"
            onchange="updateApprovedQtyByRowIndex(${origIdx}, this.value)">
          <span class="text-[10px] text-gray-600 font-bold">${escHtml(row.uom)}</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center py-10 text-gray-400 text-sm">No SKUs match the current filter (${invActiveFilterPill}).</td></tr>`;
  }
}

function updateApprovedQtyByRowIndex(origIdx, val) {
  if (inventoryGrid[origIdx]) {
    inventoryGrid[origIdx].approvedQty = Math.max(0, parseInt(val, 10) || 0);
    updateInventoryKPIs();
    populateVendorDropdown();
  }
}

// Global exposure for UI buttons & cross-module integration
if (typeof window !== 'undefined') {
  window.syncStockAgingFromStorage = syncStockAgingFromStorage;
  window.handleAgingFileUpload = handleAgingFileUpload;
  window.ingestStockAgingItems = ingestStockAgingItems;
  window.setInvFilterPill = setInvFilterPill;
  window.overrideAgingLock = overrideAgingLock;
  window.updateApprovedQtyByRowIndex = updateApprovedQtyByRowIndex;
  window.extractItemCodeAndUom = extractItemCodeAndUom;
  window.normalizeUom = normalizeUom;
  window.ingestSalesTrendItems = ingestSalesTrendItems;
  window.stockAgingMap = stockAgingMap;
  window.skuSalesTrendMap = skuSalesTrendMap;
  window.setInventoryData = (d) => { inventoryData = d; };
  window.getInventoryGrid = () => inventoryGrid;
  window.recalcInventory = recalcInventory;
  window.buildOrderCsvContent = buildOrderCsvContent;
}

// ─── INTER-BRANCH CLEARANCE TRANSFER LOGIC ──────────────────────────────────
function getRowByFilteredIdx(filteredIdx) {
  const searchQ        = (document.getElementById('invSearch')?.value || '').toLowerCase();
  const selectedVendor = document.getElementById('invVendorFilter')?.value || '';
  const onlyReorder    = document.getElementById('invFilterReorder')?.checked || false;
  let count = 0;
  for (let i = 0; i < inventoryGrid.length; i++) {
    const row = inventoryGrid[i];
    if (selectedVendor && row.vendorCode !== selectedVendor && row.orderGroup !== selectedVendor) continue;
    if (onlyReorder && row.approvedQty === 0 && row.suggestedOrder === 0) continue;
    if (searchQ && !row.itemCode.toLowerCase().includes(searchQ) && !row.desc.toLowerCase().includes(searchQ)) continue;
    if (count === filteredIdx) return row;
    count++;
  }
  return null;
}

function applyClearanceTransfer(filteredIdx, fromBranch, availableQty, expiryDate, batchNumber) {
  const row = getRowByFilteredIdx(filteredIdx);
  if (!row) return;

  const currentOrder = row.approvedQty;
  if (currentOrder <= 0) {
    alert('This SKU currently has 0 order quantity.');
    return;
  }

  const transferQty = Math.min(currentOrder, availableQty);
  row.approvedQty = currentOrder - transferQty;
  row.transferredQty = transferQty;
  row.transferredFrom = fromBranch;

  const existingIdx = interBranchTransfers.findIndex(t => t.itemCode === row.itemCode && t.fromBranch === fromBranch);
  const transferRecord = {
    itemCode: row.itemCode,
    desc: row.desc,
    fromBranch: fromBranch,
    toBranch: (typeof getSession === 'function' && getSession()?.branch) || 'This Branch',
    quantity: transferQty,
    expiryDate: expiryDate,
    batchNumber: batchNumber,
    timestamp: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    interBranchTransfers[existingIdx] = transferRecord;
  } else {
    interBranchTransfers.push(transferRecord);
  }

  updateInventoryKPIs();
  renderInventoryGrid();

  const exportBtn = document.getElementById('btnExportTransfers');
  if (exportBtn) exportBtn.classList.remove('hidden');

  alert(`🤝 Clearance Applied!\n\n${transferQty} units of ${row.desc} will be transferred from ${fromBranch} instead of ordered from supplier.\n\nSupplier order reduced from ${currentOrder} to ${row.approvedQty}.`);
}

function cancelClearanceTransfer(filteredIdx) {
  const row = getRowByFilteredIdx(filteredIdx);
  if (!row) return;

  row.approvedQty += row.transferredQty;
  const removedFrom = row.transferredFrom;
  row.transferredQty = 0;
  row.transferredFrom = '';

  interBranchTransfers = interBranchTransfers.filter(t => !(t.itemCode === row.itemCode && t.fromBranch === removedFrom));

  const exportBtn = document.getElementById('btnExportTransfers');
  if (exportBtn && interBranchTransfers.length === 0) {
    exportBtn.classList.add('hidden');
  }

  updateInventoryKPIs();
  renderInventoryGrid();
}

async function exportInterBranchTransferSheet() {
  if (interBranchTransfers.length === 0) {
    alert('No inter-branch clearance transfers have been applied.');
    return;
  }

  if (typeof ExcelJS === 'undefined') {
    alert('ExcelJS engine not ready.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Clearance_Transfers');
  sheet.columns = [
    { header: 'Item Code', key: 'code', width: 16 },
    { header: 'Item Description', key: 'desc', width: 36 },
    { header: 'Transfer From (Clearing Branch)', key: 'from', width: 28 },
    { header: 'Transfer To (Requesting Branch)', key: 'to', width: 28 },
    { header: 'Transfer Qty', key: 'qty', width: 14 },
    { header: 'Expiry Date', key: 'expiry', width: 16 },
    { header: 'Batch Number', key: 'batch', width: 18 }
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } }; // Amber

  interBranchTransfers.forEach(t => {
    sheet.addRow({
      code: t.itemCode,
      desc: t.desc,
      from: t.fromBranch,
      to: t.toBranch,
      qty: t.quantity,
      expiry: t.expiryDate,
      batch: t.batchNumber
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const dateStr = new Date().toISOString().split('T')[0];
  saveAs(blob, `PMG_InterBranch_Clearance_Transfers_${dateStr}.xlsx`);
}


function updateApprovedQtyByFilter(filteredIdx, val) {
  const searchQ        = (document.getElementById('invSearch')?.value || '').toLowerCase();
  const selectedVendor = document.getElementById('invVendorFilter')?.value || '';
  const onlyReorder    = document.getElementById('invFilterReorder')?.checked || false;
  let count = 0;
  for (let i = 0; i < inventoryGrid.length; i++) {
    const row = inventoryGrid[i];
    if (selectedVendor && row.vendorCode !== selectedVendor && row.orderGroup !== selectedVendor) continue;
    if (onlyReorder && row.approvedQty === 0 && row.suggestedOrder === 0) continue;
    if (searchQ && !row.itemCode.toLowerCase().includes(searchQ) && !row.desc.toLowerCase().includes(searchQ)) continue;
    if (count === filteredIdx) {
      inventoryGrid[i].approvedQty = Math.max(0, parseInt(val, 10) || 0);
      updateInventoryKPIs();
      populateVendorDropdown();
      return;
    }
    count++;
  }
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── BUILD XILNEX PURCHASE ORDER CSV CONTENT ─────────────────────────────────
// Format: No,Serial No@Alt Serial No,Item Code,Quantity,Cost,Shelf No,EPC,Item Name,Remark 1,Remark 2,Po Transfer No,Alt Lookup,UOM,Reference PO No,Discount Rate
function buildOrderCsvContent(rows) {
  const header = 'No,Serial No@Alt Serial No,Item Code,Quantity,Cost,Shelf No,EPC,Item Name,Remark 1,Remark 2,Po Transfer No,Alt Lookup,UOM,Reference PO No,Discount Rate';
  const dataRows = rows.map((r, idx) => {
    const lineNo   = idx + 1;
    const itemCode = csvEscape(r.itemCode);
    const qty      = r.approvedQty || 0;
    const itemName = csvEscape(r.desc);
    const uom      = csvEscape(r.uom || 'PCS');
    return `${lineNo},,${itemCode},${qty},,,,${itemName},,,,,${uom},,`;
  });
  return header + '\r\n' + dataRows.join('\r\n') + '\r\n';
}
// Alias for backwards compatibility
const buildTryOutCsvContent = buildOrderCsvContent;

// ─── DOWNLOAD INDIVIDUAL / FILTERED PO CSV ───────────────────────────────────
async function downloadOrderCsv() {
  const selectedVendor = document.getElementById('invVendorFilter')?.value || '';
  let items = inventoryGrid.filter(r => r.approvedQty > 0);

  if (selectedVendor) {
    items = items.filter(r => r.vendorCode === selectedVendor || r.orderGroup === selectedVendor);
  }

  if (items.length === 0) {
    alert(selectedVendor 
      ? `No approved order items for "${selectedVendor}". Please check order quantities.`
      : 'No approved order items to export. Please set Approved Qty > 0.');
    return;
  }

  const dateStr = new Date().toISOString().slice(0, 10);

  // If a specific vendor or sub-group was selected
  if (selectedVendor) {
    // If user selected the parent "SSJ PHARMA SDN BHD (CPD) - TRADE" (all sub-categories)
    if (isSSJPharmaVendor(selectedVendor) && !selectedVendor.includes(' - ')) {
      const subGroups = {};
      items.forEach(r => {
        const gk = r.orderGroup || getOrderGroup(r.vendorCode, r.nonFunctionalField1);
        if (!subGroups[gk]) subGroups[gk] = [];
        subGroups[gk].push(r);
      });

      const zip = new JSZip();
      let fileCount = 0;
      Object.entries(subGroups).forEach(([gKey, gRows]) => {
        const chunks = chunkRows(gRows, 200);
        chunks.forEach((chunkRows, cIdx) => {
          const partSuffix = chunks.length > 1 ? ` - Part ${cIdx + 1}` : '';
          const fileName = `${cleanFileName(gKey + partSuffix)}.csv`;
          zip.file(fileName, buildOrderCsvContent(chunkRows));
          fileCount++;
        });
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `SSJ_PHARMA_POs_${dateStr}.zip`);
      showDownloadSuccess('invDownloadTryOutBtn', `Downloaded (${fileCount} POs)!`);
      return;
    }

    // A specific sub-group (e.g. SSJ PHARMA ... - SRWK-NP) or regular vendor was selected
    const isSSJ = isSSJPharmaVendor(selectedVendor);
    const maxSkus = isSSJ ? 200 : Infinity;
    const chunks = chunkRows(items, maxSkus);

    if (chunks.length === 1) {
      const fileName = `${cleanFileName(selectedVendor)}.csv`;
      const csvContent = buildOrderCsvContent(chunks[0]);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, fileName);
      showDownloadSuccess('invDownloadTryOutBtn', 'Downloaded!');
    } else {
      // Split into parts if > 200 SKUs for SSJ Pharma
      const zip = new JSZip();
      chunks.forEach((chunkRows, cIdx) => {
        const fileName = `${cleanFileName(selectedVendor)} - Part ${cIdx + 1}.csv`;
        zip.file(fileName, buildOrderCsvContent(chunkRows));
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${cleanFileName(selectedVendor)}_Parts_${dateStr}.zip`);
      showDownloadSuccess('invDownloadTryOutBtn', `Downloaded (${chunks.length} Parts)!`);
    }
    return;
  }

  // No specific vendor selected -> "All Preferred Vendors"
  const fileName = `All_Vendors_Order_${dateStr}.csv`;
  const csvContent = buildOrderCsvContent(items);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, fileName);
  showDownloadSuccess('invDownloadTryOutBtn', 'Downloaded!');
}
// Alias for backwards compatibility
const downloadTryOutCsv = downloadOrderCsv;

// ─── PO ZIP EXPORT (SEPARATED BY PREFERRED VENDOR & CATEGORY) ────────────────
async function generatePOZip() {
  const approved = inventoryGrid.filter(r => r.approvedQty > 0);
  if (approved.length === 0) {
    alert('No approved quantities to export. Please set Approved Qty > 0 for at least one SKU.');
    return;
  }

  // Group items by orderGroup
  // For SSJ Pharma, orderGroup = 'SSJ PHARMA SDN BHD (CPD) - TRADE - [NFF1]'
  // For other vendors, orderGroup = row.vendorCode
  const groups = {};
  approved.forEach(row => {
    const groupKey = row.orderGroup || getOrderGroup(row.vendorCode, row.nonFunctionalField1);
    if (!groups[groupKey]) {
      groups[groupKey] = {
        groupKey,
        vendorCode: row.vendorCode,
        isSSJ: isSSJPharmaVendor(row.vendorCode),
        rows: []
      };
    }
    groups[groupKey].rows.push(row);
  });

  const zip = new JSZip();
  const dateStr = new Date().toISOString().slice(0, 10);
  const manifestLines = [
    'Order Document,Preferred Vendor,Non Functional Field 1,Part,SKU Count,Total Order Units,File Name,Generated Date'
  ];

  let totalFilesGenerated = 0;

  // Sort groups alphabetically so the zip files are nicely ordered
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));

  sortedGroupKeys.forEach(groupKey => {
    const groupData = groups[groupKey];
    const isSSJ = groupData.isSSJ;
    const maxSkus = isSSJ ? 200 : Infinity;
    const chunks = chunkRows(groupData.rows, maxSkus);

    chunks.forEach((chunkRows, cIdx) => {
      const partSuffix = chunks.length > 1 ? ` - Part ${cIdx + 1}` : '';
      const docName = `${groupKey}${partSuffix}`;
      const fileName = `${cleanFileName(docName)}.csv`;
      const csvContent = buildOrderCsvContent(chunkRows);

      zip.file(fileName, csvContent);
      totalFilesGenerated++;

      const totalUnits = chunkRows.reduce((s, r) => s + r.approvedQty, 0);
      const nffVal = isSSJ ? (chunkRows[0]?.nonFunctionalField1 || 'OTHER') : 'N/A';
      manifestLines.push(
        `"${docName}","${groupData.vendorCode}","${nffVal}",${chunks.length > 1 ? cIdx + 1 : '1 of 1'},${chunkRows.length},${totalUnits},"${fileName}",${dateStr}`
      );
    });
  });

  // Master combined order file (without 'TRY OUT' in name)
  const masterContent = buildOrderCsvContent(approved);
  zip.file(`_Master_All_Vendors_Order.csv`, masterContent);

  // Summary manifest
  zip.file(`_Order_Summary_${dateStr}.csv`, manifestLines.join('\r\n'));

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `Purchase_Orders_By_Vendor_${dateStr}.zip`);

  const dlBtn = document.getElementById('invDownloadBtn');
  if (dlBtn) {
    const orig = dlBtn.innerHTML;
    dlBtn.innerHTML = `<i class="fa-solid fa-circle-check mr-2"></i>Downloaded (${totalFilesGenerated} POs)!`;
    dlBtn.disabled = true;
    setTimeout(() => { dlBtn.innerHTML = orig; dlBtn.disabled = false; }, 3500);
  }
}

