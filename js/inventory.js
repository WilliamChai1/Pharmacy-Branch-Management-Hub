// js/inventory.js — Module 1: Inventory Replenishment Engine
'use strict';

// ─── STATE ────────────────────────────────────────────────────────────────────
let inventoryData = [];  // Raw parsed rows from Xilnex CSV
let inventoryGrid = [];  // Calculated rows
let interBranchTransfers = []; // List of near-expiry clearance items transferred from sister branches

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

// ─── CALCULATION ENGINE ───────────────────────────────────────────────────────
function recalcInventory() {
  const p = getParams();

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

      const uom        = resolveCol(row, ['UOM','Unit','Unit of Measure','Uom']) || 'PCS';
      const salesQty   = parseFloat(resolveCol(row, ['Sales Qty','Sales_Qty_90d','SalesQty','Qty Sold','Sales','Qty_Sold'])) || 0;
      const soh        = parseFloat(resolveCol(row, ['Quantity On Hand','SOH','Stock on Hand','StockOnHand','Closing Stock','Balance','Qty Balance'])) || 0;
      const onOrder    = parseFloat(resolveCol(row, ['In Order Quantity','On_Order','OnOrder','Pending PO','In Transit','Order Qty','Pending_PO'])) || 0;
      const activeVal  = resolveCol(row, ['Active','Status','IsActive']).trim().toLowerCase();
      const isActive   = activeVal !== 'no' && activeVal !== 'false';

      const ads            = salesQty / p.salesWindow;
      const ip             = soh + onOrder;
      const rop            = ads * (p.leadTime + p.safetyDays);
      const targetMax      = ads * p.targetDays;
      const suggestedOrder = (ip <= rop && ads > 0 && isActive) ? Math.ceil(targetMax - ip) : 0;
      const daysCover      = ads > 0 ? Math.round(soh / ads) : 9999;

      // Match clearance offers from sister branches
      const cleanCode = String(itemCode || '').trim().toUpperCase();
      const clearanceOffers = shortDatedMap[cleanCode] || [];
      if (clearanceOffers.length > 0 && suggestedOrder > 0) {
        totalClearanceOffersCount++;
      }

      return {
        itemCode, desc, vendorCode, nonFunctionalField1, orderGroup, uom, isActive,
        salesQty, soh, onOrder,
        ads: +ads.toFixed(4),
        ip, rop: +rop.toFixed(2), targetMax: +targetMax.toFixed(2),
        suggestedOrder: Math.max(0, suggestedOrder),
        daysCover: Math.min(daysCover, 9999),
        approvedQty: Math.max(0, suggestedOrder),
        clearanceOffers: clearanceOffers,
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

  const searchQ      = (document.getElementById('invSearch')?.value || '').toLowerCase();
  const selectedVendor = document.getElementById('invVendorFilter')?.value || '';
  const onlyReorder  = document.getElementById('invFilterReorder')?.checked || false;

  const filtered = inventoryGrid.filter(row => {
    if (selectedVendor) {
      if (row.vendorCode !== selectedVendor && row.orderGroup !== selectedVendor) {
        return false;
      }
    }
    if (onlyReorder && row.approvedQty === 0 && row.suggestedOrder === 0) return false;
    if (searchQ && !row.itemCode.toLowerCase().includes(searchQ) && !row.desc.toLowerCase().includes(searchQ)) return false;
    return true;
  });

  tbody.innerHTML = filtered.map((row, idx) => {
    const coverClass   = row.daysCover < 14 ? 'text-red-600 font-bold'
                       : row.daysCover < 30 ? 'text-amber-600 font-semibold'
                       : 'text-green-700';
    const coverDisplay = row.daysCover >= 9999 ? '∞' : row.daysCover + 'd';
    const needReorder  = row.suggestedOrder > 0;
    const isSSJ        = isSSJPharmaVendor(row.vendorCode);

    return `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 border-b border-gray-100">
      <td class="px-3 py-2 text-xs font-mono text-gray-700">${escHtml(row.itemCode)}</td>
      <td class="px-3 py-2 text-xs text-gray-800 max-w-sm" title="${escHtml(row.desc)}">
        <div class="font-medium">${escHtml(row.desc)}</div>
        ${row.clearanceOffers && row.clearanceOffers.length > 0 ? `
          <div class="mt-1 flex flex-col gap-1">
            ${row.clearanceOffers.map(off => `
              <div class="flex items-center justify-between gap-2 p-1 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-900">
                <span>
                  ⚡ <b class="text-amber-950 font-bold">${escHtml(off.branch)}</b> has <b>${off.quantity} pcs</b> (Exp: ${off.expiryDate}, ${off.horizonLabel})
                </span>
                ${row.transferredQty > 0 && row.transferredFrom === off.branch ? `
                  <div class="flex items-center gap-1">
                    <span class="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">✓ Transferring ${row.transferredQty} pcs</span>
                    <button type="button" onclick="cancelClearanceTransfer(${idx})" class="text-rose-600 hover:underline font-semibold ml-1">Cancel</button>
                  </div>
                ` : `
                  <button type="button" onclick="applyClearanceTransfer(${idx}, '${escHtml(off.branch)}', ${off.quantity}, '${off.expiryDate}', '${escHtml(off.batchNumber || 'N/A')}')"
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
      <td class="px-3 py-2 text-xs text-center text-gray-600">
        <div class="truncate max-w-[150px] mx-auto font-medium" title="${escHtml(row.vendorCode)}">${escHtml(row.vendorCode)}</div>
        ${row.nonFunctionalField1 ? `<span class="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${isSSJ ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 text-gray-600'}">${escHtml(row.nonFunctionalField1)}</span>` : ''}
      </td>
      <td class="px-3 py-2 text-xs text-right">${row.soh}</td>
      <td class="px-3 py-2 text-xs text-right text-gray-500">${row.onOrder}</td>
      <td class="px-3 py-2 text-xs text-right text-gray-500">${row.ads}</td>
      <td class="px-3 py-2 text-xs text-right ${coverClass}">${coverDisplay}</td>
      <td class="px-3 py-2 text-xs text-right text-gray-500">${Math.round(row.rop)}</td>
      <td class="px-3 py-2 text-xs text-right font-semibold ${needReorder ? 'text-blue-700' : 'text-gray-300'}">${row.suggestedOrder || '–'}</td>
      <td class="px-3 py-2 text-xs text-center">
        <input type="number" min="0" value="${row.approvedQty}"
          class="w-20 border border-gray-300 rounded px-1 py-0.5 text-center text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 font-bold"
          onchange="updateApprovedQtyByFilter(${idx}, this.value)">
      </td>
    </tr>`;
  }).join('');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-10 text-gray-400 text-sm">No SKUs match the current filter.</td></tr>`;
  }
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
  const dataRows = rows.map(r => {
    return `,,${csvEscape(r.itemCode)},${r.approvedQty},,,,${csvEscape(r.desc)},,,,,,,`;
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

