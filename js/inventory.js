// js/inventory.js — Module 1: Inventory Replenishment Engine
'use strict';

// ─── STATE ────────────────────────────────────────────────────────────────────
let inventoryData = [];  // Raw parsed rows from Xilnex CSV
let inventoryGrid = [];  // Calculated rows

// ─── PARAMETERS (user-editable) ──────────────────────────────────────────────
function getParams() {
  return {
    salesWindow: parseInt(document.getElementById('paramSalesWindow').value, 10) || 90,
    leadTime:    parseInt(document.getElementById('paramLeadTime').value,    10) || 7,
    safetyDays:  parseInt(document.getElementById('paramSafetyDays').value,  10) || 45,
    targetDays:  parseInt(document.getElementById('paramTargetDays').value,  10) || 70,
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

  ['paramSalesWindow','paramLeadTime','paramSafetyDays','paramTargetDays'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => { if (inventoryData.length) recalcInventory(); });
  });

  const searchEl = document.getElementById('invSearch');
  if (searchEl) searchEl.addEventListener('input', renderInventoryGrid);

  const filterToggle = document.getElementById('invFilterReorder');
  if (filterToggle) filterToggle.addEventListener('change', renderInventoryGrid);

  const dlBtn = document.getElementById('invDownloadBtn');
  if (dlBtn) dlBtn.addEventListener('click', generatePOZip);
}

// ─── FILE PARSING ─────────────────────────────────────────────────────────────
function handleInventoryFile(file) {
  const statusEl = document.getElementById('invStatus');
  if (statusEl) { statusEl.textContent = `Parsing: ${file.name}…`; statusEl.className = 'text-blue-600 text-sm mt-2'; }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete(results) {
      if (!results.data || results.data.length === 0) {
        if (statusEl) statusEl.textContent = 'Error: CSV appears empty.';
        return;
      }
      inventoryData = results.data;
      recalcInventory();
      if (statusEl) { statusEl.textContent = `✓ Loaded ${results.data.length} rows from ${file.name}`; statusEl.className = 'text-green-600 text-sm mt-2'; }
    },
    error(err) {
      if (statusEl) { statusEl.textContent = `Parse error: ${err.message}`; statusEl.className = 'text-red-600 text-sm mt-2'; }
    }
  });
}

// ─── COLUMN RESOLVER ─────────────────────────────────────────────────────────
function resolveCol(row, candidates) {
  for (const key of Object.keys(row)) {
    if (candidates.some(c => key.trim().toLowerCase() === c.toLowerCase())) return row[key];
  }
  return '';
}

// ─── CALCULATION ENGINE ───────────────────────────────────────────────────────
function recalcInventory() {
  const p = getParams();
  inventoryGrid = inventoryData
    .filter(row => Object.values(row).some(v => v && String(v).trim()))
    .map((row, idx) => {
      const itemCode   = resolveCol(row, ['Item_Code','ItemCode','item code','SKU','Code','Item']) || `ITEM${idx+1}`;
      const desc       = resolveCol(row, ['Description','Desc','Item Description','Name','Product Name']) || '';
      const vendorCode = resolveCol(row, ['Vendor_Code','VendorCode','Vendor','Supplier','Supp Code','Supplier Code']) || 'GEN';
      const uom        = resolveCol(row, ['UOM','Unit','Unit of Measure','Uom']) || 'PCS';
      const salesQty   = parseFloat(resolveCol(row, ['Sales_Qty_90d','SalesQty','Qty Sold','Sales Qty','Sales','Qty_Sold'])) || 0;
      const soh        = parseFloat(resolveCol(row, ['SOH','Stock on Hand','StockOnHand','Closing Stock','Balance','Qty Balance'])) || 0;
      const onOrder    = parseFloat(resolveCol(row, ['On_Order','OnOrder','Pending PO','In Transit','Order Qty','Pending_PO'])) || 0;

      const ads            = salesQty / p.salesWindow;
      const ip             = soh + onOrder;
      const rop            = ads * (p.leadTime + p.safetyDays);
      const targetMax      = ads * p.targetDays;
      const suggestedOrder = (ip <= rop && ads > 0) ? Math.ceil(targetMax - ip) : 0;
      const daysCover      = ads > 0 ? Math.round(soh / ads) : 9999;

      return {
        itemCode, desc, vendorCode, uom,
        salesQty, soh, onOrder,
        ads: +ads.toFixed(4),
        ip, rop: +rop.toFixed(2), targetMax: +targetMax.toFixed(2),
        suggestedOrder: Math.max(0, suggestedOrder),
        daysCover: Math.min(daysCover, 9999),
        approvedQty: Math.max(0, suggestedOrder),
      };
    });

  renderInventoryGrid();
  updateInventoryKPIs();

  const panelEl = document.getElementById('invResultPanel');
  if (panelEl) panelEl.classList.remove('hidden');
}

// ─── KPI COUNTERS ────────────────────────────────────────────────────────────
function updateInventoryKPIs() {
  const totalSKUs  = inventoryGrid.length;
  const toReorder  = inventoryGrid.filter(r => r.suggestedOrder > 0).length;
  const totalUnits = inventoryGrid.reduce((s, r) => s + (r.approvedQty || 0), 0);
  setText('kpiTotalSKUs',  totalSKUs);
  setText('kpiToReorder',  toReorder);
  setText('kpiTotalUnits', totalUnits);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── GRID RENDER ─────────────────────────────────────────────────────────────
function renderInventoryGrid() {
  const tbody = document.getElementById('invTableBody');
  if (!tbody) return;

  const searchQ     = (document.getElementById('invSearch')?.value || '').toLowerCase();
  const onlyReorder = document.getElementById('invFilterReorder')?.checked || false;

  const filtered = inventoryGrid.filter(row => {
    if (onlyReorder && row.suggestedOrder === 0) return false;
    if (searchQ && !row.itemCode.toLowerCase().includes(searchQ) && !row.desc.toLowerCase().includes(searchQ)) return false;
    return true;
  });

  tbody.innerHTML = filtered.map((row, idx) => {
    const coverClass   = row.daysCover < 14 ? 'text-red-600 font-bold'
                       : row.daysCover < 30 ? 'text-amber-600 font-semibold'
                       : 'text-green-700';
    const coverDisplay = row.daysCover >= 9999 ? '∞' : row.daysCover + 'd';
    const needReorder  = row.suggestedOrder > 0;
    return `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 border-b border-gray-100">
      <td class="px-3 py-2 text-xs font-mono text-gray-700">${escHtml(row.itemCode)}</td>
      <td class="px-3 py-2 text-xs text-gray-800 max-w-xs truncate" title="${escHtml(row.desc)}">${escHtml(row.desc)}</td>
      <td class="px-3 py-2 text-xs text-center text-gray-600">${escHtml(row.vendorCode)}</td>
      <td class="px-3 py-2 text-xs text-right">${row.soh}</td>
      <td class="px-3 py-2 text-xs text-right text-gray-500">${row.onOrder}</td>
      <td class="px-3 py-2 text-xs text-right text-gray-500">${row.ads}</td>
      <td class="px-3 py-2 text-xs text-right ${coverClass}">${coverDisplay}</td>
      <td class="px-3 py-2 text-xs text-right text-gray-500">${Math.round(row.rop)}</td>
      <td class="px-3 py-2 text-xs text-right font-semibold ${needReorder ? 'text-blue-700' : 'text-gray-300'}">${row.suggestedOrder || '–'}</td>
      <td class="px-3 py-2 text-xs text-center">
        <input type="number" min="0" value="${row.approvedQty}"
          class="w-20 border border-gray-300 rounded px-1 py-0.5 text-center text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
          onchange="updateApprovedQtyByFilter(${idx}, this.value)">
      </td>
    </tr>`;
  }).join('');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-10 text-gray-400 text-sm">No SKUs match the current filter.</td></tr>`;
  }
}

function updateApprovedQtyByFilter(filteredIdx, val) {
  const searchQ     = (document.getElementById('invSearch')?.value || '').toLowerCase();
  const onlyReorder = document.getElementById('invFilterReorder')?.checked || false;
  let count = 0;
  for (let i = 0; i < inventoryGrid.length; i++) {
    const row = inventoryGrid[i];
    if (onlyReorder && row.suggestedOrder === 0) continue;
    if (searchQ && !row.itemCode.toLowerCase().includes(searchQ) && !row.desc.toLowerCase().includes(searchQ)) continue;
    if (count === filteredIdx) {
      inventoryGrid[i].approvedQty = Math.max(0, parseInt(val, 10) || 0);
      updateInventoryKPIs();
      return;
    }
    count++;
  }
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── PO ZIP EXPORT ────────────────────────────────────────────────────────────
async function generatePOZip() {
  const approved = inventoryGrid.filter(r => r.approvedQty > 0);
  if (approved.length === 0) {
    alert('No approved quantities to export. Please set Approved Qty > 0 for at least one SKU.');
    return;
  }

  const byVendor = {};
  approved.forEach(row => {
    if (!byVendor[row.vendorCode]) byVendor[row.vendorCode] = [];
    byVendor[row.vendorCode].push(row);
  });

  const zip = new JSZip();
  const session    = getSession();
  const branchCode = session ? (BRANCHES.find(b => b.name === session.branch)?.code || 'BRANCH') : 'BRANCH';
  const dateStr    = new Date().toISOString().slice(0, 10);

  Object.entries(byVendor).forEach(([vendorCode, rows]) => {
    const csvHeader  = 'Item Code,Order Qty,UOM\r\n';
    const csvBody    = rows.map(r => `${r.itemCode},${r.approvedQty},${r.uom}`).join('\r\n');
    zip.file(`${vendorCode}_PO_${branchCode}_${dateStr}.csv`, csvHeader + csvBody + '\r\n');
  });

  // Summary manifest
  const manifestLines = ['Vendor Code,SKU Count,Total Units,Generated Date'];
  Object.entries(byVendor).forEach(([vc, rows]) => {
    const total = rows.reduce((s, r) => s + r.approvedQty, 0);
    manifestLines.push(`${vc},${rows.length},${total},${dateStr}`);
  });
  zip.file(`_PO_Summary_${branchCode}_${dateStr}.csv`, manifestLines.join('\r\n'));

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `Xilnex_PO_${branchCode}_${dateStr}.zip`);

  const dlBtn = document.getElementById('invDownloadBtn');
  if (dlBtn) {
    const orig = dlBtn.innerHTML;
    dlBtn.innerHTML = '<i class="fa-solid fa-circle-check mr-2"></i>Downloaded!';
    dlBtn.disabled = true;
    setTimeout(() => { dlBtn.innerHTML = orig; dlBtn.disabled = false; }, 3000);
  }
}
