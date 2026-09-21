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

// ─── CALCULATION ENGINE ───────────────────────────────────────────────────────
function recalcInventory() {
  const p = getParams();
  inventoryGrid = inventoryData
    .filter(row => Object.values(row).some(v => v && String(v).trim()))
    .map((row, idx) => {
      const itemCode   = resolveCol(row, ['Item Code','Item_Code','ItemCode','item code','SKU','Code','Item']) || `ITEM${idx+1}`;
      const desc       = resolveCol(row, ['Item Name','Item Description','Description','Desc','Name','Product Name']) || '';
      let vendorCode   = resolveCol(row, ['Preferred Vendor','Vendor_Code','VendorCode','Vendor','Supplier','Supp Code','Supplier Code']).trim();
      if (!vendorCode || vendorCode === '-') vendorCode = 'UNASSIGNED';
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

      return {
        itemCode, desc, vendorCode, uom, isActive,
        salesQty, soh, onOrder,
        ads: +ads.toFixed(4),
        ip, rop: +rop.toFixed(2), targetMax: +targetMax.toFixed(2),
        suggestedOrder: Math.max(0, suggestedOrder),
        daysCover: Math.min(daysCover, 9999),
        approvedQty: Math.max(0, suggestedOrder),
      };
    });

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
  inventoryGrid.forEach(r => {
    const vc = r.vendorCode || 'UNASSIGNED';
    if (!vendorMap[vc]) vendorMap[vc] = { total: 0, toOrder: 0 };
    vendorMap[vc].total++;
    if (r.approvedQty > 0) vendorMap[vc].toOrder++;
  });

  const sortedVendors = Object.keys(vendorMap).sort((a, b) => {
    if (vendorMap[b].toOrder !== vendorMap[a].toOrder) {
      return vendorMap[b].toOrder - vendorMap[a].toOrder;
    }
    return a.localeCompare(b);
  });

  select.innerHTML = '<option value="">All Preferred Vendors (' + sortedVendors.length + ' vendors)</option>' + sortedVendors.map(v => {
    const count = vendorMap[v].toOrder;
    return `<option value="${escHtml(v)}">${escHtml(v)} (${count} to order)</option>`;
  }).join('');

  if (currentVal && sortedVendors.includes(currentVal)) {
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
    if (selectedVendor && row.vendorCode !== selectedVendor) return false;
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
    return `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 border-b border-gray-100">
      <td class="px-3 py-2 text-xs font-mono text-gray-700">${escHtml(row.itemCode)}</td>
      <td class="px-3 py-2 text-xs text-gray-800 max-w-xs truncate" title="${escHtml(row.desc)}">${escHtml(row.desc)}</td>
      <td class="px-3 py-2 text-xs text-center text-gray-600 truncate max-w-[150px]" title="${escHtml(row.vendorCode)}">${escHtml(row.vendorCode)}</td>
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
  const searchQ        = (document.getElementById('invSearch')?.value || '').toLowerCase();
  const selectedVendor = document.getElementById('invVendorFilter')?.value || '';
  const onlyReorder    = document.getElementById('invFilterReorder')?.checked || false;
  let count = 0;
  for (let i = 0; i < inventoryGrid.length; i++) {
    const row = inventoryGrid[i];
    if (selectedVendor && row.vendorCode !== selectedVendor) continue;
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

// ─── BUILD XILNEX TRY OUT CSV CONTENT ───────────────────────────────────────
// Format: No,Serial No@Alt Serial No,Item Code,Quantity,Cost,Shelf No,EPC,Item Name,Remark 1,Remark 2,Po Transfer No,Alt Lookup,UOM,Reference PO No,Discount Rate
function buildTryOutCsvContent(rows) {
  const header = 'No,Serial No@Alt Serial No,Item Code,Quantity,Cost,Shelf No,EPC,Item Name,Remark 1,Remark 2,Po Transfer No,Alt Lookup,UOM,Reference PO No,Discount Rate';
  const dataRows = rows.map(r => {
    return `,,${csvEscape(r.itemCode)},${r.approvedQty},,,,${csvEscape(r.desc)},,,,,,,`;
  });
  return header + '\r\n' + dataRows.join('\r\n') + '\r\n';
}

// ─── DOWNLOAD SINGLE TRY OUT.CSV ─────────────────────────────────────────────
function downloadTryOutCsv() {
  const selectedVendor = document.getElementById('invVendorFilter')?.value || '';
  let items = inventoryGrid.filter(r => r.approvedQty > 0);

  if (selectedVendor) {
    items = items.filter(r => r.vendorCode === selectedVendor);
  }

  if (items.length === 0) {
    alert(selectedVendor 
      ? `No approved order items for vendor "${selectedVendor}". Please check order quantities.`
      : 'No approved order items to export. Please set Approved Qty > 0.');
    return;
  }

  const csvContent = buildTryOutCsvContent(items);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Directly download as TRY OUT.csv (or with vendor name if user wants clarity)
  const filename = selectedVendor ? `TRY OUT - ${selectedVendor.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv` : 'TRY OUT.csv';
  saveAs(blob, filename);

  const btn = document.getElementById('invDownloadTryOutBtn');
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-check mr-2"></i>Downloaded!';
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 3000);
  }
}

// ─── PO ZIP EXPORT (SEPARATED BY PREFERRED VENDOR) ───────────────────────────
async function generatePOZip() {
  const approved = inventoryGrid.filter(r => r.approvedQty > 0);
  if (approved.length === 0) {
    alert('No approved quantities to export. Please set Approved Qty > 0 for at least one SKU.');
    return;
  }

  const byVendor = {};
  approved.forEach(row => {
    const v = row.vendorCode || 'UNASSIGNED';
    if (!byVendor[v]) byVendor[v] = [];
    byVendor[v].push(row);
  });

  const zip = new JSZip();
  const dateStr = new Date().toISOString().slice(0, 10);

  // 1. Create a TRY OUT CSV for each vendor
  Object.entries(byVendor).forEach(([vendorCode, rows]) => {
    const cleanName = vendorCode.replace(/[^a-zA-Z0-9_-]/g, '_');
    const csvContent = buildTryOutCsvContent(rows);
    zip.file(`TRY OUT - ${cleanName}.csv`, csvContent);
  });

  // 2. Also include a master TRY OUT.csv with all approved items combined
  const masterContent = buildTryOutCsvContent(approved);
  zip.file('TRY OUT.csv', masterContent);

  // 3. Summary manifest
  const manifestLines = ['Preferred Vendor,SKU Count,Total Order Units,Generated Date'];
  Object.entries(byVendor).forEach(([vc, rows]) => {
    const total = rows.reduce((s, r) => s + r.approvedQty, 0);
    manifestLines.push(`"${vc}",${rows.length},${total},${dateStr}`);
  });
  zip.file(`_Vendor_Summary_${dateStr}.csv`, manifestLines.join('\r\n'));

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `Xilnex_Ordering_By_Vendor_${dateStr}.zip`);

  const dlBtn = document.getElementById('invDownloadBtn');
  if (dlBtn) {
    const orig = dlBtn.innerHTML;
    dlBtn.innerHTML = '<i class="fa-solid fa-circle-check mr-2"></i>Downloaded!';
    dlBtn.disabled = true;
    setTimeout(() => { dlBtn.innerHTML = orig; dlBtn.disabled = false; }, 3000);
  }
}
