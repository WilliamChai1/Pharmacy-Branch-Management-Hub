// js/returns-cn.js — PMG Credit Note, PRN & Delivery Order (DO) Tracker Module
'use strict';

(function(window) {
  const DB_STORE_NAME = 'pmg_returns_cn_db';
  const DB_VERSION = 1;

  // ─── STATE MANAGEMENT ─────────────────────────────────────────────────────────
  let returnsData = [];
  let currentFilter = 'all'; // 'all', 'pending_pickup', 'awaiting_cn', 'completed'
  let currentSearchQuery = '';
  let activeReturnForDo = null;
  let activeReturnForUpload = null;
  let activeReturnForCn = null;
  let dbInstance = null;

  // ─── SUPPLIER & WAREHOUSE DESTINATION PRESETS ─────────────────────────────────
  // Delivery destination address is optional; vendor/transporter decides warehouse
  const DESTINATION_PRESETS = [
    {
      name: 'SSJ PHARMA SDN BHD',
      companyName: 'SSJ PHARMA SDN BHD',
      address: '',
      attn: '',
      phone: ''
    },
    {
      name: 'DKSH MALAYSIA SDN BHD',
      companyName: 'DKSH MALAYSIA SDN BHD',
      address: '',
      attn: '',
      phone: ''
    },
    {
      name: 'ZUELLIG PHARMA SDN BHD',
      companyName: 'ZUELLIG PHARMA SDN BHD',
      address: '',
      attn: '',
      phone: ''
    },
    {
      name: 'APEX PHARMACY MARKETING SDN BHD',
      companyName: 'APEX PHARMACY MARKETING SDN BHD',
      address: '',
      attn: '',
      phone: ''
    },
    {
      name: 'SUNWARD PHARMACEUTICAL (M) SDN BHD',
      companyName: 'SUNWARD PHARMACEUTICAL (M) SDN BHD',
      address: '',
      attn: '',
      phone: ''
    },
    {
      name: 'DUOPHARMA (M) SENDIRIAN BERHAD',
      companyName: 'DUOPHARMA (M) SENDIRIAN BERHAD',
      address: '',
      attn: '',
      phone: ''
    },
    {
      name: 'KOTRA PHARMA (M) SDN BHD',
      companyName: 'KOTRA PHARMA (M) SDN BHD',
      address: '',
      attn: '',
      phone: ''
    },
    {
      name: 'PHARMANIAGA LOGISTICS SDN BHD',
      companyName: 'PHARMANIAGA LOGISTICS SDN BHD',
      address: '',
      attn: '',
      phone: ''
    },
    {
      name: 'PMG CENTRAL WAREHOUSE / HQ',
      companyName: 'PMG HEALTHCARE SDN BHD (CENTRAL WAREHOUSE)',
      address: '',
      attn: '',
      phone: ''
    }
  ];

  // ─── INITIAL SEED DATA ────────────────────────────────────────────────────────
  const SEED_RETURNS = [];

  // ─── INDEXEDDB HELPERS ────────────────────────────────────────────────────────
  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (dbInstance) return resolve(dbInstance);
      const req = indexedDB.open('pmg_returns_db', DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
          const store = db.createObjectStore(DB_STORE_NAME, { keyPath: 'id' });
          store.createIndex('branch', 'branch', { unique: false });
          store.createIndex('doNumber', 'doNumber', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };
      req.onsuccess = () => {
        dbInstance = req.result;
        resolve(dbInstance);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function loadReturnsFromDb() {
    try {
      const db = await openDatabase();
      const hasSeeded = localStorage.getItem('pmg_returns_seeded') === 'true';
      const deletedIds = JSON.parse(localStorage.getItem('pmg_deleted_returns') || '["ret-ks-2609-002", "ret-lnd-2609-001"]');

      return new Promise((resolve) => {
        const tx = db.transaction(DB_STORE_NAME, 'readonly');
        const store = tx.objectStore(DB_STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          let list = (req.result || []).filter(r => !deletedIds.includes(r.id));
          if (list.length === 0 && !hasSeeded) {
            // Seed initial data once
            localStorage.setItem('pmg_returns_seeded', 'true');
            const cleanSeed = SEED_RETURNS.filter(r => !deletedIds.includes(r.id));
            saveAllReturnsToDb(cleanSeed).then(() => resolve(cleanSeed));
          } else {
            // Purge deleted records from DB store if any remained
            if (deletedIds.length > 0 && req.result && req.result.length > 0) {
              deletedIds.forEach(did => deleteReturnFromDb(did));
            }
            resolve(list);
          }
        };
        req.onerror = () => resolve([]);
      });
    } catch (err) {
      console.warn('[PMG Returns] DB error:', err);
      return [];
    }
  }

  async function saveAllReturnsToDb(list) {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(DB_STORE_NAME);
        store.clear();
        list.forEach(item => store.put(item));
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('[PMG Returns] Save DB error:', err);
      return false;
    }
  }

  async function saveSingleReturnToDb(retItem) {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(DB_STORE_NAME);
        store.put(retItem);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('[PMG Returns] Save single DB error:', err);
      return false;
    }
  }

  async function deleteReturnFromDb(retId) {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(DB_STORE_NAME);
        store.delete(retId);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('[PMG Returns] Delete DB error:', err);
      return false;
    }
  }

  // ─── ONEDRIVE SYNC INTEGRATION ───────────────────────────────────────────────
  async function syncReturnsWithOneDrive(targetBranch) {
    if (!window.pmgOneDriveSync || typeof window.pmgOneDriveSync.saveReturnsDatabaseToOneDrive !== 'function') {
      return;
    }

    try {
      const branch = targetBranch || getActiveBranchName();
      const deletedIds = JSON.parse(localStorage.getItem('pmg_deleted_returns') || '["ret-ks-2609-002"]');

      // 1. Check if OneDrive has cloud data
      const cloudData = await window.pmgOneDriveSync.loadReturnsDatabaseFromOneDrive(branch);
      if (Array.isArray(cloudData) && cloudData.length > 0) {
        // Filter out any tombstoned deleted IDs
        const cleanCloud = cloudData.filter(r => !deletedIds.includes(r.id));
        const map = new Map();
        returnsData.filter(r => !deletedIds.includes(r.id)).forEach(r => map.set(r.id, r));
        cleanCloud.forEach(r => map.set(r.id, r));
        returnsData = Array.from(map.values());
        await saveAllReturnsToDb(returnsData);
      }

      // 2. Push current state back to OneDrive
      const branchOnlyData = returnsData.filter(r => (r.branch || '').toUpperCase() === branch.toUpperCase() && !deletedIds.includes(r.id));
      await window.pmgOneDriveSync.saveReturnsDatabaseToOneDrive(branch, branchOnlyData);
      console.log(`[PMG Returns] Synced returns with OneDrive for ${branch}`);
    } catch (err) {
      console.warn('[PMG Returns] OneDrive sync skipped:', err);
    }
  }

  // ─── BRANCH HELPERS ──────────────────────────────────────────────────────────
  function getActiveBranchName() {
    const session = typeof getSession === 'function' ? getSession() : null;
    const filterEl = document.getElementById('returnsBranchFilter');
    if (filterEl && filterEl.value) {
      return filterEl.value;
    }
    if (session && session.branch && session.branch !== 'ALL') {
      return session.branch;
    }
    return 'Kota Sentosa';
  }

  function getBranchDetails(branchName) {
    const bName = (branchName || '').trim();
    if (typeof BRANCHES !== 'undefined' && Array.isArray(BRANCHES)) {
      const match = BRANCHES.find(b => 
        (b.name || '').toUpperCase() === bName.toUpperCase() ||
        (b.code || '').toUpperCase() === bName.toUpperCase()
      );
      if (match) {
        return {
          name: match.name,
          code: match.code,
          companyName: match.companyName || `PMG PHARMACY (${match.name.toUpperCase()}) SDN BHD`,
          address: match.address || 'SARAWAK, MALAYSIA.'
        };
      }
    }
    const fallbackAddresses = {
      'Kota Sentosa': 'GROUND FLOOR, NO. 7, LOT 39, BLOCK 233, KNLD, 7TH MILE BAZAAR, PENRISSEN ROAD, 93250 KUCHING, SARAWAK.',
      'Matang Jaya': 'LOT 694G, BLOCK C, LOT 6798, SYNERGY SQUARE, MATANG JAYA, 93050 KUCHING, SARAWAK.',
      'Sungai Moyan': 'E-1-45, LOT 4568, GROUND FLOOR, BLOCK 10, MLD, GENESIS WALK, JALAN BATU KAWA/MATANG, 93250 KUCHING, SARAWAK.',
      'Malihah': 'NO. 44-45, LOT 4792-4793, GROUND FLOOR, BLOCK 8, MATANG LAND DISTRICT, TAMAN SUNGAI TENGAH VALLEY, BATU 7, JALAN BELATOK, 93050 KUCHING, SARAWAK.',
      'Metrocity': 'LOT 22, METROCITY COMMERCIAL CENTRE, JALAN MATANG, 93050 KUCHING, SARAWAK.',
      'Astana': 'LOT 10000, GROUND FLOOR, SECTION 65, KTLD, JALAN ASTANA, PETRA JAYA, 93050 KUCHING, SARAWAK.',
      'Samariang': 'GROUND FLOOR, SUBLOT 18, LOT 5587, AREA S3B, BANDAR BARU SAMARIANG, JALAN SULTAN TENGAH, 93050 KUCHING, SARAWAK.'
    };
    return {
      name: bName || 'Kota Sentosa',
      code: 'KS01',
      companyName: `PMG PHARMACY (${bName.toUpperCase()}) SDN BHD`,
      address: fallbackAddresses[bName] || 'SARAWAK, MALAYSIA.'
    };
  }

  // ─── INITIALIZATION ──────────────────────────────────────────────────────────
  async function initReturnsModule() {
    returnsData = await loadReturnsFromDb();
    populateReturnsBranchFilter();
    renderReturnsUI();

    // Trigger OneDrive cloud sync in background
    setTimeout(() => {
      syncReturnsWithOneDrive(getActiveBranchName());
    }, 1200);
  }

  function populateReturnsBranchFilter() {
    const select = document.getElementById('returnsBranchFilter');
    if (!select) return;

    const session = typeof getSession === 'function' ? getSession() : null;
    const isAM = session?.role === 'AM';

    select.innerHTML = '';
    if (isAM) {
      const allOpt = document.createElement('option');
      allOpt.value = '';
      allOpt.textContent = 'All Branches (Area Manager)';
      select.appendChild(allOpt);
    }

    if (typeof BRANCHES !== 'undefined' && Array.isArray(BRANCHES)) {
      BRANCHES.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.name;
        opt.textContent = `${b.code} – ${b.name}`;
        if (!isAM && session?.branch && (session.branch === b.name || session.branch === b.code)) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    }

    if (!isAM && session?.branch && session.branch !== 'ALL') {
      select.value = session.branch;
      select.disabled = true;
    }
  }

  // ─── UI RENDERING ────────────────────────────────────────────────────────────
  function renderReturnsUI() {
    renderReturnsSummaryCards();
    renderReturnsTable();
  }

  function renderReturnsSummaryCards() {
    const branchFilter = document.getElementById('returnsBranchFilter')?.value || '';
    const filtered = branchFilter 
      ? returnsData.filter(r => (r.branch || '').toUpperCase() === branchFilter.toUpperCase())
      : returnsData;

    const totalActive = filtered.length;
    const pendingPickup = filtered.filter(r => r.status === 'pending_pickup').length;
    const awaitingCn = filtered.filter(r => r.status === 'awaiting_cn').length;
    const completed = filtered.filter(r => r.status === 'completed').length;

    const elTotal = document.getElementById('returnsTotalCount');
    const elPending = document.getElementById('returnsPendingPickupCount');
    const elAwaiting = document.getElementById('returnsAwaitingCnCount');
    const elCompleted = document.getElementById('returnsCompletedCount');

    if (elTotal) elTotal.textContent = totalActive;
    if (elPending) elPending.textContent = pendingPickup;
    if (elAwaiting) elAwaiting.textContent = awaitingCn;
    if (elCompleted) elCompleted.textContent = completed;
  }

  function renderReturnsTable() {
    const tbody = document.getElementById('returnsTableBody');
    if (!tbody) return;

    const branchFilter = (document.getElementById('returnsBranchFilter')?.value || '').trim().toUpperCase();
    const query = (currentSearchQuery || '').trim().toLowerCase();

    const filtered = returnsData.filter(r => {
      // 1. Branch filter
      if (branchFilter && (r.branch || '').toUpperCase() !== branchFilter) {
        return false;
      }
      // 2. Status tab filter
      if (currentFilter !== 'all' && r.status !== currentFilter) {
        return false;
      }
      // 3. Search query (Search by Item Name, PRN Number, Item Code, DO Number, Supplier)
      if (query) {
        const matchesDo = (r.doNumber || '').toLowerCase().includes(query);
        const matchesSupplier = (r.supplier || '').toLowerCase().includes(query);
        const matchesBranch = (r.branch || '').toLowerCase().includes(query);
        const matchesCn = (r.cnNumber || '').toLowerCase().includes(query);
        const matchesItems = (r.items || []).some(item => 
          (item.itemCode || '').toLowerCase().includes(query) ||
          (item.itemDescription || '').toLowerCase().includes(query) ||
          (item.prnNumber || '').toLowerCase().includes(query) ||
          (item.reason || '').toLowerCase().includes(query)
        );
        return matchesDo || matchesSupplier || matchesBranch || matchesCn || matchesItems;
      }
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-10 text-gray-400">
            <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400">
              <i class="fa-solid fa-box-open text-xl"></i>
            </div>
            <p class="text-sm font-semibold">No stock return or credit note records found.</p>
            <p class="text-xs text-gray-400 mt-1">Click <b>+ New Return / Compound DO</b> to create your first delivery order.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(ret => {
      // Calculate PRN badges
      const prnSet = new Set((ret.items || []).map(i => i.prnNumber).filter(Boolean));
      const prnBadges = Array.from(prnSet).map(prn => 
        `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
          ${escapeHtml(prn)}
        </span>`
      ).join(' ');

      // Status Badge
      let statusBadge = '';
      if (ret.status === 'pending_pickup') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
          <i class="fa-solid fa-clock"></i> Pending Pickup
        </span>`;
      } else if (ret.status === 'awaiting_cn') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
          <i class="fa-solid fa-truck-fast"></i> Awaiting CN
        </span>`;
      } else if (ret.status === 'completed') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <i class="fa-solid fa-circle-check"></i> Keyed in Xilnex
        </span>`;
      }

      // Signed Proof status
      let proofBadge = '';
      if (ret.signedProof && ret.signedProof.fileName) {
        proofBadge = `<button onclick="pmgReturns.viewSignedProof('${ret.id}')" title="View signed DO proof: ${escapeHtml(ret.signedProof.fileName)}" class="text-xs text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <i class="fa-solid fa-file-shield"></i> Proof Attached
        </button>`;
      } else {
        proofBadge = `<span class="text-[11px] text-gray-400 italic">No proof yet</span>`;
      }

      // Credit Note info
      let cnDisplay = '';
      if (ret.cnNumber) {
        cnDisplay = `
          <div class="font-mono text-xs font-bold text-gray-800">${escapeHtml(ret.cnNumber)}</div>
          <div class="text-[11px] text-emerald-600 font-semibold">RM ${(Number(ret.cnAmount) || 0).toFixed(2)}</div>
        `;
      } else {
        cnDisplay = `<span class="text-xs text-amber-600 font-medium italic">Pending supplier</span>`;
      }

      // SKU summary preview
      const itemCount = (ret.items || []).length;
      const firstItem = ret.items && ret.items[0] ? ret.items[0].itemDescription : '';
      const itemPreview = itemCount > 1 ? `${firstItem} <b class="text-blue-600">+${itemCount - 1} more</b>` : firstItem;

      return `
        <tr class="border-b border-gray-100 hover:bg-slate-50/80 transition text-sm">
          <td class="py-3 px-4">
            <div class="font-bold text-blue-900 font-mono flex items-center gap-1.5">
              <i class="fa-solid fa-file-invoice text-blue-600 text-xs"></i>
              ${escapeHtml(ret.doNumber)}
            </div>
            <div class="text-xs text-gray-500 mt-0.5">${escapeHtml(ret.date)} · <span class="font-medium text-gray-700">${escapeHtml(ret.branch)}</span></div>
          </td>
          <td class="py-3 px-4">
            <div class="font-bold text-gray-800 text-xs">${escapeHtml(ret.supplier || 'General Supplier')}</div>
            <div class="mt-1 flex flex-wrap gap-1">${prnBadges || '<span class="text-gray-400 text-xs">-</span>'}</div>
          </td>
          <td class="py-3 px-4">
            <div class="text-xs text-gray-800 max-w-xs truncate" title="${escapeHtml(firstItem)}">${itemPreview}</div>
            <div class="text-[11px] text-gray-500 mt-0.5 font-medium">
              <i class="fa-solid fa-box text-amber-600"></i> ${ret.totalCartons} Carton(s) (${itemCount} SKU${itemCount > 1 ? 's' : ''})
            </div>
          </td>
          <td class="py-3 px-4 text-center">
            ${statusBadge}
          </td>
          <td class="py-3 px-4">
            ${proofBadge}
          </td>
          <td class="py-3 px-4">
            ${cnDisplay}
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="pmgReturns.openPrintDoModal('${ret.id}')" class="px-2.5 py-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg border border-blue-200 transition flex items-center gap-1" title="View & Print PMG Delivery Order">
                <i class="fa-solid fa-print"></i> <span>DO Form</span>
              </button>
              <button onclick="pmgReturns.openPrintCartonLabelModal('${ret.id}')" class="px-2.5 py-1.5 text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold rounded-lg border border-amber-300 transition flex items-center gap-1" title="Print Big Box / Carton Shipping Labels for Transporter">
                <i class="fa-solid fa-tags"></i> <span>Box Labels</span>
              </button>
              <button onclick="pmgReturns.openUploadSignedDoModal('${ret.id}')" class="px-2 py-1.5 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold rounded-lg border border-slate-300 transition" title="Upload Signed DO Proof to OneDrive">
                <i class="fa-solid fa-cloud-arrow-up"></i>
              </button>
              <button onclick="pmgReturns.openSettleCnModal('${ret.id}')" class="px-2 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-lg border border-emerald-300 transition" title="Settle Credit Note & Key Xilnex">
                <i class="fa-solid fa-check-double"></i>
              </button>
              <button onclick="pmgReturns.deleteReturn('${ret.id}')" class="px-2 py-1.5 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition" title="Delete record">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ─── FILTER & SEARCH HANDLERS ────────────────────────────────────────────────
  function setReturnsFilter(filterName) {
    currentFilter = filterName;
    document.querySelectorAll('.returns-filter-btn').forEach(btn => {
      btn.classList.remove('active', 'border-blue-600', 'text-blue-700', 'font-bold');
      btn.classList.add('border-transparent', 'text-gray-500');
    });

    const activeBtn = document.getElementById(`returns-filter-${filterName}`);
    if (activeBtn) {
      activeBtn.classList.add('active', 'border-blue-600', 'text-blue-700', 'font-bold');
      activeBtn.classList.remove('border-transparent', 'text-gray-500');
    }

    renderReturnsTable();
  }

  function handleReturnsSearch(query) {
    currentSearchQuery = query;
    renderReturnsTable();
  }

  // ─── MODAL 1: NEW RETURN APPLICATION & COMPOUND DO CREATOR ───────────────────
  let draftItems = [];

  function openNewReturnModal() {
    const modal = document.getElementById('newReturnModal');
    if (!modal) return;

    const branchName = getActiveBranchName();
    const branchInfo = getBranchDetails(branchName);

    // Reset draft fields
    document.getElementById('nrBranchSelect').value = branchInfo.name;
    document.getElementById('nrCompanyName').value = branchInfo.companyName;
    document.getElementById('nrCompanyAddress').value = branchInfo.address;
    document.getElementById('nrSupplier').value = '';
    
    // Reset destination fields
    const presetEl = document.getElementById('nrDestPreset');
    if (presetEl) presetEl.value = '';
    document.getElementById('nrDestCompany').value = '';
    document.getElementById('nrDestAddress').value = '';
    document.getElementById('nrDestAttn').value = '';
    document.getElementById('nrDestPhone').value = '';

    document.getElementById('nrDoNumber').value = generateNextDoNumber(branchInfo.name);
    document.getElementById('nrDate').value = formatTodayDateForDo();
    document.getElementById('nrVerifiedBy').value = getCurrentUserDisplayName();
    document.getElementById('nrRemarks').value = '';

    // Initial 2 empty items
    draftItems = [
      { cartonNo: 1, itemCode: '', itemDescription: '', quantity: 1, uom: 'BOX', prnNumber: '', reason: 'Near Expiry', batchNo: '', expiryDate: '' }
    ];

    renderDraftItemsTable();
    modal.classList.remove('hidden');
  }

  function closeNewReturnModal() {
    document.getElementById('newReturnModal')?.classList.add('hidden');
  }

  function onNrBranchChanged() {
    const branchName = document.getElementById('nrBranchSelect').value;
    const branchInfo = getBranchDetails(branchName);
    document.getElementById('nrCompanyName').value = branchInfo.companyName;
    document.getElementById('nrCompanyAddress').value = branchInfo.address;
    document.getElementById('nrDoNumber').value = generateNextDoNumber(branchName);
  }

  function onDestPresetChanged(presetName) {
    if (!presetName || presetName === 'CUSTOM') return;
    const preset = DESTINATION_PRESETS.find(p => p.name === presetName || p.companyName === presetName);
    if (preset) {
      document.getElementById('nrDestCompany').value = preset.companyName;
      document.getElementById('nrDestAddress').value = preset.address;
      document.getElementById('nrDestAttn').value = preset.attn || '';
      document.getElementById('nrDestPhone').value = preset.phone || '';
      const supplierInput = document.getElementById('nrSupplier');
      if (supplierInput && !supplierInput.value.trim()) {
        supplierInput.value = preset.name;
      }
    }
  }

  function generateNextDoNumber(branchName) {
    const bInfo = getBranchDetails(branchName);
    const prefix = bInfo.code ? bInfo.code.replace(/\d+/g, '').substring(0, 3).toUpperCase() : 'DO';
    const now = new Date();
    const yr = String(now.getFullYear()).substring(2);
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 900) + 100);
    return `DO-${prefix || 'PMG'}-${yr}${mo}-${rand}`;
  }

  function formatTodayDateForDo() {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const yr = d.getFullYear();
    return `${day}.${mon}.${yr}`;
  }

  function getCurrentUserDisplayName() {
    const session = typeof getSession === 'function' ? getSession() : null;
    return session?.displayName || 'Pharmacist';
  }

  function syncDraftItemsFromDom() {
    const tbody = document.getElementById('nrItemsTableBody');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
      if (!draftItems[index]) return;
      row.querySelectorAll('[data-field]').forEach(el => {
        const field = el.getAttribute('data-field');
        if (field) {
          draftItems[index][field] = el.value;
        }
      });
    });
  }

  function addDraftItemRow() {
    syncDraftItemsFromDom();
    const lastCarton = draftItems.length > 0 ? (draftItems[draftItems.length - 1].cartonNo || 1) : 1;
    const lastPrn = draftItems.length > 0 ? (draftItems[draftItems.length - 1].prnNumber || '') : '';

    draftItems.push({
      cartonNo: lastCarton,
      itemCode: '',
      itemDescription: '',
      quantity: 1,
      uom: 'BOX',
      prnNumber: lastPrn,
      reason: 'Near Expiry',
      batchNo: '',
      expiryDate: ''
    });

    renderDraftItemsTable();
  }

  function removeDraftItemRow(index) {
    syncDraftItemsFromDom();
    if (draftItems.length <= 1) {
      alert('A Delivery Order must have at least one return item.');
      return;
    }
    draftItems.splice(index, 1);
    renderDraftItemsTable();
  }

  function updateDraftItem(index, field, value) {
    if (!draftItems[index]) return;
    draftItems[index][field] = value;
    if (field === 'cartonNo' || field === 'prnNumber') {
      checkPrnLimitsAndCartons();
    }
  }

  // PRN 3-SKU LIMIT CHECKER & CARTON COUNTER
  function checkPrnLimitsAndCartons() {
    // 1. Calculate Carton count
    const uniqueCartons = new Set(draftItems.map(it => String(it.cartonNo || 1).trim()).filter(Boolean));
    const totalCartons = Math.max(1, uniqueCartons.size);
    const cartonIndicator = document.getElementById('nrTotalCartonBadge');
    if (cartonIndicator) {
      cartonIndicator.textContent = `Total Number of Carton: ${totalCartons}`;
    }

    // 2. Check PRN 3-SKU Limit Rule
    const prnCounts = {};
    draftItems.forEach(it => {
      const prn = (it.prnNumber || '').trim();
      if (prn) {
        prnCounts[prn] = (prnCounts[prn] || 0) + 1;
      }
    });

    const violations = Object.entries(prnCounts).filter(([prn, count]) => count > 3);
    const alertBox = document.getElementById('nrPrnLimitWarning');

    if (violations.length > 0) {
      const msg = violations.map(([prn, count]) => `<b>${escapeHtml(prn)}</b> has <b>${count} SKUs</b>`).join(', ');
      if (alertBox) {
        alertBox.innerHTML = `
          <div class="flex items-start gap-2">
            <i class="fa-solid fa-triangle-exclamation text-amber-600 text-sm mt-0.5"></i>
            <div>
              <p class="font-bold text-amber-900 text-xs">⚠️ Manual PRN Slip Limit Exceeded (Max 3 SKUs per slip!):</p>
              <p class="text-xs text-amber-800 mt-0.5">${msg}. Company SOP allows a maximum of 3 items per physical PRN slip. Please assign another PRN number for excess items or click <b>"Auto-Split by 3 SKUs"</b> below.</p>
            </div>
          </div>
        `;
        alertBox.classList.remove('hidden');
      }
    } else if (alertBox) {
      alertBox.classList.add('hidden');
    }
  }

  function autoGroupPrnByThree() {
    syncDraftItemsFromDom();
    const basePrn = prompt('Enter starting PRN booklet slip number (e.g. PRN-001 or 12345):', 'PRN-001');
    if (!basePrn) return;

    let prnPrefix = basePrn;
    let prnNum = 1;
    const match = basePrn.match(/^(.*?)(\d+)$/);
    if (match) {
      prnPrefix = match[1];
      prnNum = parseInt(match[2], 10);
    }

    draftItems.forEach((item, index) => {
      const slipGroup = Math.floor(index / 3);
      const currentSlipNum = prnNum + slipGroup;
      item.prnNumber = `${prnPrefix}${String(currentSlipNum).padStart(3, '0')}`;
    });

    renderDraftItemsTable();
  }

  function renderDraftItemsTable() {
    const tbody = document.getElementById('nrItemsTableBody');
    if (!tbody) return;

    tbody.innerHTML = draftItems.map((item, index) => `
      <tr class="border-b border-gray-100 text-xs">
        <td class="py-2 px-2 text-center">
          <input data-field="cartonNo" type="number" min="1" max="99" value="${item.cartonNo || 1}" oninput="pmgReturns.updateDraftItem(${index}, 'cartonNo', this.value)" onchange="pmgReturns.updateDraftItem(${index}, 'cartonNo', this.value)" class="w-12 text-center border border-gray-300 rounded px-1 py-1 font-bold text-gray-700">
        </td>
        <td class="py-2 px-2">
          <input data-field="itemCode" type="text" placeholder="e.g. 103366" value="${escapeHtml(item.itemCode || '')}" oninput="pmgReturns.updateDraftItem(${index}, 'itemCode', this.value)" onchange="pmgReturns.updateDraftItem(${index}, 'itemCode', this.value)" class="w-24 border border-gray-300 rounded px-2 py-1 font-mono uppercase">
        </td>
        <td class="py-2 px-2">
          <input data-field="itemDescription" type="text" placeholder="e.g. FINAINTAS 5MG TAB 10'S" value="${escapeHtml(item.itemDescription || '')}" oninput="pmgReturns.updateDraftItem(${index}, 'itemDescription', this.value)" onchange="pmgReturns.updateDraftItem(${index}, 'itemDescription', this.value)" class="w-full border border-gray-300 rounded px-2 py-1 font-semibold text-gray-800">
        </td>
        <td class="py-2 px-2">
          <div class="flex items-center gap-1">
            <input data-field="quantity" type="number" min="1" value="${item.quantity || 1}" oninput="pmgReturns.updateDraftItem(${index}, 'quantity', this.value)" onchange="pmgReturns.updateDraftItem(${index}, 'quantity', this.value)" class="w-14 border border-gray-300 rounded px-1.5 py-1 text-center font-bold">
            <select data-field="uom" onchange="pmgReturns.updateDraftItem(${index}, 'uom', this.value)" class="border border-gray-300 rounded px-1 py-1 text-xs">
              <option value="BOX" ${item.uom === 'BOX' ? 'selected' : ''}>BOX</option>
              <option value="BTL" ${item.uom === 'BTL' ? 'selected' : ''}>BTL</option>
              <option value="TAB" ${item.uom === 'TAB' ? 'selected' : ''}>TAB</option>
              <option value="PACK" ${item.uom === 'PACK' ? 'selected' : ''}>PACK</option>
              <option value="STRIP" ${item.uom === 'STRIP' ? 'selected' : ''}>STRIP</option>
              <option value="UNIT" ${item.uom === 'UNIT' ? 'selected' : ''}>UNIT</option>
              <option value="CTN" ${item.uom === 'CTN' ? 'selected' : ''}>CTN</option>
            </select>
          </div>
        </td>
        <td class="py-2 px-2">
          <input data-field="prnNumber" type="text" placeholder="e.g. PRN-0412" value="${escapeHtml(item.prnNumber || '')}" oninput="pmgReturns.updateDraftItem(${index}, 'prnNumber', this.value)" onchange="pmgReturns.updateDraftItem(${index}, 'prnNumber', this.value)" class="w-24 border border-gray-300 rounded px-2 py-1 font-mono font-bold text-amber-800 bg-amber-50/50">
        </td>
        <td class="py-2 px-2">
          <select data-field="reason" onchange="pmgReturns.updateDraftItem(${index}, 'reason', this.value)" class="w-full border border-gray-300 rounded px-1.5 py-1 text-xs">
            <option value="Near Expiry" ${item.reason === 'Near Expiry' ? 'selected' : ''}>Near Expiry</option>
            <option value="Expired" ${item.reason === 'Expired' ? 'selected' : ''}>Expired</option>
            <option value="Damaged Goods" ${item.reason === 'Damaged Goods' ? 'selected' : ''}>Damaged Goods</option>
            <option value="Supplier Recall" ${item.reason === 'Supplier Recall' ? 'selected' : ''}>Supplier Recall</option>
            <option value="Slow Moving Stock" ${item.reason === 'Slow Moving Stock' ? 'selected' : ''}>Slow Moving</option>
            <option value="Wrong Delivery" ${item.reason === 'Wrong Delivery' ? 'selected' : ''}>Wrong Delivery</option>
            <option value="Other" ${item.reason === 'Other' ? 'selected' : ''}>Other</option>
          </select>
        </td>
        <td class="py-2 px-2 text-center">
          <button type="button" onclick="pmgReturns.removeDraftItemRow(${index})" class="text-rose-500 hover:text-rose-700 text-sm p-1" title="Remove SKU">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      </tr>
    `).join('');

    checkPrnLimitsAndCartons();
  }

  async function saveNewReturnApplication() {
    syncDraftItemsFromDom();
    const branch = document.getElementById('nrBranchSelect').value;
    const companyName = document.getElementById('nrCompanyName').value.trim();
    const companyAddress = document.getElementById('nrCompanyAddress').value.trim();
    const supplier = document.getElementById('nrSupplier').value.trim();
    const doNumber = document.getElementById('nrDoNumber').value.trim();
    const date = document.getElementById('nrDate').value.trim();
    const verifiedBy = document.getElementById('nrVerifiedBy').value.trim();
    const remarks = document.getElementById('nrRemarks').value.trim();

    // Destination Details
    const destCompany = document.getElementById('nrDestCompany').value.trim();
    const destAddress = document.getElementById('nrDestAddress').value.trim();
    const destAttn = document.getElementById('nrDestAttn').value.trim();
    const destPhone = document.getElementById('nrDestPhone').value.trim();

    if (!companyName || !doNumber || !date) {
      alert('Please fill in Company Name, DO Number, and Date.');
      return;
    }

    if (!destCompany) {
      alert('Please fill in Destination Company Name (or select a supplier preset). Destination Address is optional.');
      return;
    }

    if (draftItems.length === 0) {
      alert('Please add at least one item to return.');
      return;
    }

    // Validate items
    for (let i = 0; i < draftItems.length; i++) {
      if (!draftItems[i].itemDescription || !draftItems[i].itemDescription.trim()) {
        alert(`Item #${i + 1} is missing an Item Description.`);
        return;
      }
    }

    // Calculate unique cartons
    const uniqueCartons = new Set(draftItems.map(it => String(it.cartonNo || 1).trim()).filter(Boolean));
    const totalCartons = Math.max(1, uniqueCartons.size);

    const newRecord = {
      id: `ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      doNumber: doNumber,
      branch: branch,
      branchCode: getBranchDetails(branch).code,
      companyName: companyName,
      companyAddress: companyAddress,
      date: date,
      supplier: supplier || destCompany || 'General Supplier',
      destCompany: destCompany,
      destAddress: destAddress,
      destAttn: destAttn,
      destPhone: destPhone,
      totalCartons: totalCartons,
      status: 'pending_pickup',
      verifiedBy: verifiedBy || getCurrentUserDisplayName(),
      pickupBy: '',
      pickupDate: '',
      signedProof: null,
      cnNumber: '',
      cnAmount: 0,
      cnDate: '',
      xilnexKeyed: false,
      xilnexKeyedDate: '',
      xilnexKeyedBy: '',
      remarks: remarks,
      items: JSON.parse(JSON.stringify(draftItems)),
      createdAt: new Date().toISOString()
    };

    returnsData.unshift(newRecord);
    await saveSingleReturnToDb(newRecord);

    // Sync to OneDrive
    syncReturnsWithOneDrive(branch);

    closeNewReturnModal();
    renderReturnsUI();

    // Auto-open DO print preview
    openPrintDoModal(newRecord.id);
  }

  // ─── MODAL 2: OFFICIAL PMG DELIVERY ORDER (DO) PRINT VIEW ────────────────────
  function openPrintDoModal(returnId) {
    const ret = returnsData.find(r => r.id === returnId);
    if (!ret) return;
    activeReturnForDo = ret;

    const modal = document.getElementById('printDoModal');
    const container = document.getElementById('printDoDocumentContainer');
    if (!modal || !container) return;

    // Render PMG standard DO table rows
    let currentCtn = null;
    const tableRows = (ret.items || []).map(item => {
      const ctnDisplay = (item.cartonNo !== currentCtn) ? item.cartonNo : '';
      currentCtn = item.cartonNo;
      return `
        <tr>
          <td style="border: 1px solid #111; padding: 6px 8px; text-align: center; font-weight: bold; width: 75px;">${ctnDisplay}</td>
          <td style="border: 1px solid #111; padding: 6px 8px; font-family: monospace; font-weight: bold; width: 110px;">${escapeHtml(item.itemCode || '-')}</td>
          <td style="border: 1px solid #111; padding: 6px 8px; font-weight: 600;">${escapeHtml(item.itemDescription || '')}</td>
          <td style="border: 1px solid #111; padding: 6px 8px; text-align: center; font-weight: bold; width: 100px;">${item.quantity || 1} ${escapeHtml(item.uom || 'BOX')}</td>
        </tr>
      `;
    }).join('');

    // Fill blank rows to mimic standard full-sheet DO appearance
    const blankRowsCount = Math.max(0, 8 - (ret.items || []).length);
    let blankRowsHtml = '';
    for (let i = 0; i < blankRowsCount; i++) {
      blankRowsHtml += `
        <tr style="height: 24px;">
          <td style="border: 1px solid #111; padding: 6px 8px;"></td>
          <td style="border: 1px solid #111; padding: 6px 8px;"></td>
          <td style="border: 1px solid #111; padding: 6px 8px;"></td>
          <td style="border: 1px solid #111; padding: 6px 8px;"></td>
        </tr>
      `;
    }

    container.innerHTML = `
      <div id="pmgOfficialDoPrintArea" style="font-family: Arial, sans-serif; color: #000; background: #fff; padding: 24px; max-width: 800px; margin: 0 auto; line-height: 1.35;">
        <!-- Header -->
        <div style="font-weight: 900; font-size: 18px; letter-spacing: 0.5px; margin-bottom: 2px;">DELIVERY ORDER</div>
        <div style="font-weight: 900; font-size: 15px; text-transform: uppercase;">${escapeHtml(ret.companyName)}</div>
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; max-width: 600px;">${escapeHtml(ret.companyAddress)}</div>
        
        <!-- Deliver To / Destination Section -->
        <div style="margin-top: 10px; margin-bottom: 10px; padding: 8px 12px; background: #fafafa; border: 1.5px solid #000; border-radius: 4px;">
          <div style="font-size: 10px; font-weight: 900; color: #555; text-transform: uppercase; letter-spacing: 0.5px;">DELIVER TO / DESTINATION:</div>
          <div style="font-size: 14px; font-weight: 900; color: #000; margin-top: 2px; text-transform: uppercase;">${escapeHtml(ret.destCompany || ret.supplier || 'N/A')}</div>
          ${ret.destAddress ? `<div style="font-size: 11px; font-weight: 600; color: #222; text-transform: uppercase; margin-top: 1px;">${escapeHtml(ret.destAddress)}</div>` : `<div style="font-size: 10px; font-style: italic; color: #666; margin-top: 1px;">(Warehouse destination to be determined by vendor / transporter)</div>`}
          ${(ret.destAttn || ret.destPhone) ? `
            <div style="font-size: 11px; font-weight: bold; color: #333; margin-top: 3px; display: flex; gap: 15px; flex-wrap: wrap;">
              ${ret.destAttn ? `<span><b>Attn:</b> ${escapeHtml(ret.destAttn)}</span>` : ''}
              ${ret.destPhone ? `<span><b>Tel:</b> ${escapeHtml(ret.destPhone)}</span>` : ''}
            </div>
          ` : ''}
        </div>

        <!-- Metadata -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6px; margin-bottom: 6px; font-weight: bold; font-size: 13px;">
          <div>DO: <span style="font-family: monospace; font-size: 14px;">${escapeHtml(ret.doNumber)}</span></div>
          <div>Date: <span>${escapeHtml(ret.date)}</span></div>
        </div>

        <!-- Supplier & PRN Info -->
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #333; margin-bottom: 8px; border-bottom: 1px dashed #666; padding-bottom: 4px;">
          <div><b>Supplier / Vendor:</b> ${escapeHtml(ret.supplier || 'N/A')}</div>
          <div><b>PRN Slips:</b> ${Array.from(new Set(ret.items.map(i => i.prnNumber).filter(Boolean))).join(', ') || 'N/A'}</div>
        </div>

        <!-- DO Table -->
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-size: 12px; margin-top: 4px;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid #111; padding: 6px 8px; text-align: center; width: 75px; font-weight: 900;">CTN NO</th>
              <th style="border: 1px solid #111; padding: 6px 8px; text-align: left; width: 110px; font-weight: 900;">ITEM CODE</th>
              <th style="border: 1px solid #111; padding: 6px 8px; text-align: left; font-weight: 900;">ITEM DESCRIPTION</th>
              <th style="border: 1px solid #111; padding: 6px 8px; text-align: center; width: 100px; font-weight: 900;">QUANTITY</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            ${blankRowsHtml}
          </tbody>
        </table>

        <!-- Total Carton Summary -->
        <div style="margin-top: 10px; font-weight: 900; font-size: 13px;">
          Total Number of Carton: ${ret.totalCartons}
        </div>

        <!-- Signatures Handover Box -->
        <div style="display: flex; justify-content: space-between; margin-top: 35px; font-size: 12px;">
          <div style="width: 250px;">
            <div style="border-bottom: 1px solid #000; height: 35px;"></div>
            <div style="font-weight: bold; margin-top: 4px;">Verified by:</div>
            <div style="font-size: 11px; color: #444;">${escapeHtml(ret.verifiedBy || 'Branch Staff')}</div>
            <div style="font-size: 10px; color: #666; margin-top: 2px;">(Branch Staff Signature & Stamp)</div>
          </div>
          <div style="width: 250px;">
            <div style="border-bottom: 1px solid #000; height: 35px;"></div>
            <div style="font-weight: bold; margin-top: 4px;">Pick Up by:</div>
            <div style="font-size: 11px; color: #444;">${escapeHtml(ret.pickupBy || 'Transporter / Driver')}</div>
            <div style="font-size: 10px; color: #666; margin-top: 2px;">(Transporter Signature / IC / Date)</div>
          </div>
        </div>

        <!-- Footer Notice -->
        <div style="margin-top: 25px; font-size: 10px; color: #777; border-top: 1px solid #ddd; padding-top: 4px; display: flex; justify-content: space-between;">
          <span>PMG Pharmacy System Generated DO · Auto-Archived in Company OneDrive</span>
          <span>Proof required for credit note claim</span>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  function closePrintDoModal() {
    document.getElementById('printDoModal')?.classList.add('hidden');
  }

  function executePrintDo() {
    const printArea = document.getElementById('pmgOfficialDoPrintArea');
    if (!printArea) return;

    // Inject dedicated print styles to isolate DO document on clean A4 page
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${activeReturnForDo ? activeReturnForDo.doNumber : 'PMG_DO'}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm 15mm 15mm 15mm; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          table { border-collapse: collapse; }
        </style>
      </head>
      <body>
        ${printArea.outerHTML}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.frameElement.remove(); }, 1500);
          };
        <\/script>
      </body>
      </html>
    `);
    doc.close();
  }

  // ─── MODAL 2B: LARGE BOX / CARTON SHIPPING LABELS GENERATOR ──────────────────
  let activeReturnForLabels = null;
  let activeCartonTemplate = 'SSJ_NORMAL';

  const SSJ_TEMPLATES_CONFIG = {
    SSJ_NORMAL: {
      title: 'PLEASE USE THIS TEMPLATE WHEN DO NORMAL STOCK RETURN',
      category: 'RETURN STOCK',
      to: 'SSJ PHARMA SDN BHD (SCD)',
      attn: 'MR DOUGLAS',
      showRemarks: false,
      dateLabel: 'DATE RETURN',
      badgeText: 'SSJ WAREHOUSE VERIFIED',
      caution: '⚠️ PHARMACEUTICAL RETURN GOODS · RETURNING TO SSJ WAREHOUSE · HANDLE WITH CARE ⚠️'
    },
    SSJ_AGING: {
      title: 'PLEASE USE THIS TEMPLATE WHEN DO NORMAL STOCK RETURN',
      category: 'RETURN STOCK (AGING STOCK WITH LONGER EXPIRY > 1 YEARS)',
      to: 'SSJ PHARMA SDN BHD (SCD)',
      attn: 'MR DOUGLAS',
      showRemarks: false,
      dateLabel: 'DATE RETURN',
      badgeText: 'SSJ WAREHOUSE AGING STOCK',
      caution: '⚠️ RETURN STOCK (AGING WITH LONG EXPIRY > 1 YR) · SSJ WAREHOUSE VERIFIED ⚠️'
    },
    SSJ_RECALL: {
      title: 'PLEASE USE THIS TEMPLATE WHEN DO ANY RETURN STOCK (PRODUCT RECALL) TO SSJ',
      category: 'PRODUCT RECALL',
      to: 'SSJ PHARMA SDN BHD (SCD)',
      attn: 'MR DOUGLAS',
      showRemarks: true,
      remarks: 'HANDLE WITH CARE-FRAGILE ITEM',
      showDeadline: true,
      dateLabel: 'DATE RETURN',
      badgeText: 'SSJ URGENT PRODUCT RECALL',
      caution: '🚨 URGENT PRODUCT RECALL RETURN GOODS · PRIORITY SSJ WAREHOUSE RECEIVING 🚨'
    },
    INTERBRANCH: {
      title: 'PLEASE USE THIS TEMPLATE WHEN DO STOCK IN-TRANSIT',
      category: 'IN-TRANSIT',
      to: null, // dynamic
      attn: null, // dynamic
      showRemarks: false,
      dateLabel: 'DATE PASS TO DRIVER',
      badgeText: 'INTERBRANCH TRANSIT',
      caution: '🚚 INTERBRANCH STOCK IN-TRANSIT · OUTLET TO OUTLET DIRECT TRANSFER 🚚'
    }
  };

  function onCartonTemplateChanged(templateKey) {
    activeCartonTemplate = templateKey || 'SSJ_NORMAL';
    renderCartonLabelsHtml(activeCartonTemplate);
  }

  function renderCartonLabelsHtml(templateKey) {
    const container = document.getElementById('printCartonLabelsContainer');
    if (!container || !activeReturnForLabels) return;

    const ret = activeReturnForLabels;
    const totalCartons = Math.max(1, ret.totalCartons || 1);
    const prnList = Array.from(new Set((ret.items || []).map(i => i.prnNumber).filter(Boolean))).join(', ');
    const tpl = templateKey || activeCartonTemplate || 'SSJ_NORMAL';

    let labelsHtml = '';

    for (let c = 1; c <= totalCartons; c++) {
      const itemsInThisCarton = (ret.items || []).filter(item => {
        const cNum = parseInt(String(item.cartonNo || 1).replace(/\D/g, ''), 10) || 1;
        return cNum === c;
      });

      if (tpl === 'VENDOR_STANDARD') {
        // Standard Non-SSJ / Generic Vendor Shipping Label
        labelsHtml += `
          <div class="carton-shipping-box" style="page-break-after: always; width: 100%; max-width: 780px; margin: 0 auto 30px auto; border: 4px solid #000; padding: 22px; font-family: Arial, sans-serif; background: #fff; box-sizing: border-box; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
            <!-- Top Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3.5px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
              <div style="font-size: 20px; font-weight: 900; letter-spacing: 1px;">🚚 CARTON SHIPPING / DELIVERY LABEL</div>
              <div style="font-size: 15px; font-weight: 900; background: #000; color: #fff; padding: 5px 12px; border-radius: 4px;">PMG PHARMACY</div>
            </div>

            <!-- DESTINATION (SHIP TO) -->
            <div style="border: 3.5px solid #000; padding: 18px; background: #fafafa; margin-bottom: 18px;">
              <div style="font-size: 13px; font-weight: 900; text-transform: uppercase; color: #444; letter-spacing: 1.5px; border-bottom: 2px dashed #999; padding-bottom: 5px; margin-bottom: 10px;">
                SHIP TO / DELIVER TO (DESTINATION):
              </div>
              <div style="font-size: 26px; font-weight: 900; color: #000; line-height: 1.2; text-transform: uppercase; margin-bottom: 8px;">
                ${escapeHtml(ret.destCompany || ret.supplier || 'N/A')}
              </div>
              <div style="font-size: 15px; font-weight: 700; color: #111; line-height: 1.35; text-transform: uppercase;">
                ${ret.destAddress ? escapeHtml(ret.destAddress) : '<span style="color: #666; font-style: italic; font-size: 14px;">(DESTINATION WAREHOUSE TO BE CONFIRMED BY VENDOR / TRANSPORTER)</span>'}
              </div>
              ${(ret.destAttn || ret.destPhone) ? `
                <div style="margin-top: 12px; padding-top: 10px; border-top: 2px dashed #999; font-size: 15px; font-weight: 900; display: flex; gap: 25px; flex-wrap: wrap;">
                  ${ret.destAttn ? `<div>ATTN: <span style="font-size: 17px; text-decoration: underline;">${escapeHtml(ret.destAttn)}</span></div>` : ''}
                  ${ret.destPhone ? `<div>TEL: <span style="font-size: 17px; font-family: monospace;">${escapeHtml(ret.destPhone)}</span></div>` : ''}
                </div>
              ` : ''}
            </div>

            <!-- SENDER & CARTON BADGE ROW -->
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
              <div style="flex: 1.2; border: 2.5px solid #000; padding: 14px; background: #fff;">
                <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #444; border-bottom: 1.5px solid #bbb; padding-bottom: 4px; margin-bottom: 6px;">
                  SENDER (FROM):
                </div>
                <div style="font-size: 15px; font-weight: 900; text-transform: uppercase;">${escapeHtml(ret.companyName || ('PMG PHARMACY (' + (ret.branch || 'BRANCH') + ')'))}</div>
                <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; margin-top: 4px; color: #222;">${escapeHtml(ret.companyAddress || 'Sarawak, Malaysia')}</div>
                <div style="font-size: 12px; font-weight: bold; margin-top: 6px; color: #000;">BRANCH PIC: ${escapeHtml(ret.verifiedBy || 'Branch Pharmacist')}</div>
              </div>

              <div style="flex: 1; border: 4px solid #000; background: #f4f4f4; padding: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #333;">CARTON IDENTIFIER</div>
                <div style="font-size: 38px; font-weight: 900; color: #000; line-height: 1.05; margin: 6px 0;">
                  CARTON ${c} OF ${totalCartons}
                </div>
                <div style="font-size: 12px; font-weight: 900; background: #000; color: #fff; padding: 3px 10px; border-radius: 4px;">
                  TOTAL ${totalCartons} CARTON(S)
                </div>
              </div>
            </div>

            <!-- SHIPMENT METADATA BAR -->
            <div style="display: flex; justify-content: space-between; align-items: center; border: 2.5px solid #000; padding: 10px 16px; font-size: 14px; font-weight: 900; margin-bottom: 14px; background: #fff;">
              <div>DO NO: <span style="font-family: monospace; font-size: 16px; color: #0d47a1;">${escapeHtml(ret.doNumber)}</span></div>
              <div>DATE: <span>${escapeHtml(ret.date)}</span></div>
              <div>PRN REF: <span style="font-family: monospace;">${prnList || 'N/A'}</span></div>
            </div>

            <!-- PACKED ITEMS IN CARTON -->
            ${itemsInThisCarton.length > 0 ? `
              <div style="border: 2px solid #000; margin-bottom: 14px; background: #fff; font-size: 12px;">
                <div style="background: #e2e8f0; padding: 5px 10px; font-weight: 900; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; color: #1e293b; border-bottom: 1.5px solid #000; display: flex; justify-content: space-between;">
                  <span>📦 PACKED ITEMS IN CARTON ${c}:</span>
                  <span>${itemsInThisCarton.length} SKU(S)</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                  <thead>
                    <tr style="background: #f8fafc; border-bottom: 1px solid #000;">
                      <th style="padding: 4px 8px; text-align: left; width: 110px; border-right: 1px solid #ddd;">ITEM CODE</th>
                      <th style="padding: 4px 8px; text-align: left; border-right: 1px solid #ddd;">ITEM DESCRIPTION</th>
                      <th style="padding: 4px 8px; text-align: center; width: 90px; border-right: 1px solid #ddd;">PRN NO</th>
                      <th style="padding: 4px 8px; text-align: right; width: 80px;">QTY</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsInThisCarton.map(it => `
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 4px 8px; font-family: monospace; font-weight: bold; border-right: 1px solid #ddd;">${escapeHtml(it.itemCode || '-')}</td>
                        <td style="padding: 4px 8px; font-weight: 600; border-right: 1px solid #ddd;">${escapeHtml(it.itemDescription || '')}</td>
                        <td style="padding: 4px 8px; text-align: center; font-family: monospace; font-weight: bold; border-right: 1px solid #ddd;">${escapeHtml(it.prnNumber || '-')}</td>
                        <td style="padding: 4px 8px; text-align: right; font-weight: bold;">${it.quantity || 1} ${escapeHtml(it.uom || 'BOX')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <!-- SPECIAL HANDLING WARNING -->
            <div style="border: 2.5px dashed #d32f2f; background: #fff5f5; color: #b71c1c; padding: 10px; text-align: center; font-weight: 900; font-size: 14px; letter-spacing: 0.5px;">
              ⚠️ PHARMACEUTICAL RETURN GOODS · HANDLE WITH CARE · KEEP DRY · DO NOT DROP ⚠️
            </div>
          </div>
        `;
      } else {
        // Official SSJ Templates: SSJ_NORMAL, SSJ_AGING, SSJ_RECALL, INTERBRANCH
        const cfg = SSJ_TEMPLATES_CONFIG[tpl] || SSJ_TEMPLATES_CONFIG.SSJ_NORMAL;
        const targetTo = cfg.to || ret.destCompany || 'SSJ PHARMA SDN BHD (SCD)';
        const targetAttn = cfg.attn || ret.destAttn || (tpl === 'INTERBRANCH' ? 'BRANCH PHARMACIST / PIC' : 'MR DOUGLAS');

        labelsHtml += `
          <div class="carton-shipping-box" style="page-break-after: always; width: 100%; max-width: 780px; margin: 0 auto 30px auto; border: 4px solid #000; padding: 22px; font-family: Arial, sans-serif; background: #fff; box-sizing: border-box; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
            
            <!-- SSJ Official Header Banner (Exact wording from HQ Excel Template) -->
            <div style="background: #000; color: #fff; text-align: center; font-size: 15px; font-weight: 900; letter-spacing: 0.5px; padding: 9px 14px; margin-bottom: 16px; border-radius: 4px; text-transform: uppercase;">
              ${cfg.title}
            </div>

            <!-- Official SSJ Specification Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 3px solid #000;">
              <tbody>
                <tr>
                  <td style="width: 210px; padding: 10px 14px; font-size: 13px; font-weight: 900; background: #e2e8f0; border: 2px solid #000; text-transform: uppercase; color: #0f172a;">
                    CATEGORY RETURN
                  </td>
                  <td style="padding: 10px 14px; font-size: 18px; font-weight: 900; border: 2px solid #000; color: #000; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${cfg.category}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 900; background: #e2e8f0; border: 2px solid #000; text-transform: uppercase; color: #0f172a;">
                    FROM
                  </td>
                  <td style="padding: 10px 14px; font-size: 16px; font-weight: 900; border: 2px solid #000; color: #000; text-transform: uppercase;">
                    <div>${escapeHtml(ret.companyName || ('PMG PHARMACY (' + (ret.branch || 'BRANCH') + ')'))}</div>
                    <div style="font-size: 12px; font-weight: 600; color: #444; margin-top: 3px;">${escapeHtml(ret.companyAddress || 'Sarawak, Malaysia')}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 900; background: #e2e8f0; border: 2px solid #000; text-transform: uppercase; color: #0f172a;">
                    TO
                  </td>
                  <td style="padding: 10px 14px; font-size: 18px; font-weight: 900; border: 2px solid #000; color: #000; text-transform: uppercase;">
                    ${escapeHtml(targetTo)}
                    ${ret.destAddress && targetTo !== 'SSJ PHARMA SDN BHD (SCD)' ? `<div style="font-size: 12px; font-weight: 600; color: #444; margin-top: 3px;">${escapeHtml(ret.destAddress)}</div>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 900; background: #e2e8f0; border: 2px solid #000; text-transform: uppercase; color: #0f172a;">
                    ATTENTION
                  </td>
                  <td style="padding: 10px 14px; font-size: 17px; font-weight: 900; border: 2px solid #000; color: #000; text-transform: uppercase;">
                    ${escapeHtml(targetAttn)}
                    ${ret.destPhone ? `<span style="font-size: 14px; font-weight: bold; margin-left: 14px; font-family: monospace;">(TEL: ${escapeHtml(ret.destPhone)})</span>` : ''}
                  </td>
                </tr>
                ${cfg.showRemarks ? `
                  <tr>
                    <td style="padding: 10px 14px; font-size: 13px; font-weight: 900; background: #fee2e2; border: 2px solid #000; text-transform: uppercase; color: #991b1b;">
                      REMARKS
                    </td>
                    <td style="padding: 10px 14px; font-size: 15px; font-weight: 900; border: 2px solid #000; color: #b91c1c; text-transform: uppercase;">
                      ${cfg.remarks || 'HANDLE WITH CARE-FRAGILE ITEM'}${ret.remarks ? ' · ' + escapeHtml(ret.remarks) : ''}
                    </td>
                  </tr>
                ` : ''}
                ${cfg.showDeadline ? `
                  <tr>
                    <td style="padding: 10px 14px; font-size: 13px; font-weight: 900; background: #fee2e2; border: 2px solid #000; text-transform: uppercase; color: #991b1b;">
                      DEADLINE RETURN
                    </td>
                    <td style="padding: 10px 14px; font-size: 15px; font-weight: 900; border: 2px solid #000; color: #b91c1c; text-transform: uppercase;">
                      URGENT / WITHIN 24-48 HOURS
                    </td>
                  </tr>
                ` : ''}
                <tr>
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 900; background: #e2e8f0; border: 2px solid #000; text-transform: uppercase; color: #0f172a;">
                    ${cfg.dateLabel}
                  </td>
                  <td style="padding: 10px 14px; font-size: 16px; font-weight: 900; border: 2px solid #000; color: #000;">
                    ${escapeHtml(ret.date)}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Carton Identifier & DO Summary Row -->
            <div style="display: flex; gap: 14px; margin-bottom: 14px;">
              <div style="flex: 1; border: 3px solid #000; background: #f8fafc; padding: 12px 14px; text-align: center;">
                <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #475569; letter-spacing: 1px;">CARTON IDENTIFIER</div>
                <div style="font-size: 34px; font-weight: 900; color: #000; line-height: 1.1; margin: 4px 0;">CARTON ${c} OF ${totalCartons}</div>
                <div style="font-size: 11px; font-weight: 900; background: #000; color: #fff; display: inline-block; padding: 2px 10px; border-radius: 3px;">TOTAL ${totalCartons} CARTON(S)</div>
              </div>
              <div style="flex: 1.2; border: 3px solid #000; background: #fff; padding: 12px 14px; display: flex; flex-direction: column; justify-content: center;">
                <div style="font-size: 13px; font-weight: 900; margin-bottom: 4px;">DO NUMBER: <span style="font-family: monospace; font-size: 15px; color: #0d47a1;">${escapeHtml(ret.doNumber)}</span></div>
                <div style="font-size: 13px; font-weight: 900; margin-bottom: 4px;">PRN REF: <span style="font-family: monospace; font-size: 13px; color: #92400e;">${prnList || 'N/A'}</span></div>
                <div style="font-size: 12px; font-weight: bold; color: #475569;">BRANCH PIC: ${escapeHtml(ret.verifiedBy || 'Branch Pharmacist')}</div>
              </div>
            </div>

            <!-- PACKED ITEMS IN CARTON (RECEIVING WAREHOUSE CHECKLIST) -->
            ${itemsInThisCarton.length > 0 ? `
              <div style="border: 2px solid #000; margin-bottom: 14px; background: #fff; font-size: 12px;">
                <div style="background: #e2e8f0; padding: 6px 10px; font-weight: 900; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; color: #1e293b; border-bottom: 1.5px solid #000; display: flex; justify-content: space-between;">
                  <span>📦 PACKED ITEMS IN CARTON ${c}:</span>
                  <span>${itemsInThisCarton.length} SKU(S)</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                  <thead>
                    <tr style="background: #f8fafc; border-bottom: 1px solid #000;">
                      <th style="padding: 5px 8px; text-align: left; width: 110px; border-right: 1px solid #ddd;">ITEM CODE</th>
                      <th style="padding: 5px 8px; text-align: left; border-right: 1px solid #ddd;">ITEM DESCRIPTION</th>
                      <th style="padding: 5px 8px; text-align: center; width: 90px; border-right: 1px solid #ddd;">PRN NO</th>
                      <th style="padding: 5px 8px; text-align: right; width: 80px;">QTY</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsInThisCarton.map(it => `
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 5px 8px; font-family: monospace; font-weight: bold; border-right: 1px solid #ddd;">${escapeHtml(it.itemCode || '-')}</td>
                        <td style="padding: 5px 8px; font-weight: 600; border-right: 1px solid #ddd;">${escapeHtml(it.itemDescription || '')}</td>
                        <td style="padding: 5px 8px; text-align: center; font-family: monospace; font-weight: bold; border-right: 1px solid #ddd;">${escapeHtml(it.prnNumber || '-')}</td>
                        <td style="padding: 5px 8px; text-align: right; font-weight: bold;">${it.quantity || 1} ${escapeHtml(it.uom || 'BOX')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <!-- SPECIAL HANDLING WARNING -->
            <div style="border: 2.5px dashed #000; background: #fffbeb; color: #000; padding: 10px; text-align: center; font-weight: 900; font-size: 13px; letter-spacing: 0.5px;">
              ${cfg.caution}
            </div>
          </div>
        `;
      }
    }

    container.innerHTML = labelsHtml;
  }

  function openPrintCartonLabelModal(returnId) {
    console.log('[PMG Returns] openPrintCartonLabelModal triggered with ID:', returnId);
    const id = returnId || (activeReturnForDo ? activeReturnForDo.id : null) || (activeReturnForLabels ? activeReturnForLabels.id : null);
    let ret = returnsData.find(r => r.id === id);
    if (!ret && returnsData.length > 0) {
      ret = returnsData[0];
    }
    if (!ret) {
      alert('Please create or select a return record first to generate box labels.');
      return;
    }
    activeReturnForLabels = ret;

    const modal = document.getElementById('printCartonLabelModal');
    const container = document.getElementById('printCartonLabelsContainer');
    if (!modal || !container) {
      console.error('[PMG Returns] Carton label modal elements missing in DOM:', { modal, container });
      return;
    }

    // Auto-detect template based on destination and reasons
    let detectedTemplate = 'SSJ_NORMAL';
    const destUpper = ((ret.destCompany || '') + ' ' + (ret.supplier || '')).toUpperCase();
    const hasRecall = (ret.items || []).some(it => (it.reason || '').toLowerCase().includes('recall'));
    const hasAging = (ret.items || []).some(it => (it.reason || '').toLowerCase().includes('slow') || (it.reason || '').toLowerCase().includes('aging'));

    if (destUpper.includes('SSJ')) {
      if (hasRecall) detectedTemplate = 'SSJ_RECALL';
      else if (hasAging) detectedTemplate = 'SSJ_AGING';
      else detectedTemplate = 'SSJ_NORMAL';
    } else if (destUpper.includes('PMG') || destUpper.includes('BRANCH') || destUpper.includes('SENTOSA') || destUpper.includes('OUTLET')) {
      detectedTemplate = 'INTERBRANCH';
    } else {
      detectedTemplate = 'VENDOR_STANDARD';
    }

    activeCartonTemplate = detectedTemplate;
    const tplSelect = document.getElementById('cartonLabelTemplateSelect');
    if (tplSelect) {
      tplSelect.value = detectedTemplate;
    }

    renderCartonLabelsHtml(activeCartonTemplate);
    modal.classList.remove('hidden');
  }

  function closePrintCartonLabelModal() {
    const modal = document.getElementById('printCartonLabelModal');
    if (modal) modal.classList.add('hidden');
  }

  function executePrintCartonLabels() {
    const container = document.getElementById('printCartonLabelsContainer');
    if (!container) return;

    try {
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);

      const doc = printFrame.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PMG_Carton_Labels_${activeReturnForLabels ? activeReturnForLabels.doNumber : 'Cartons'}</title>
          <style>
            @page { size: A4 landscape; margin: 8mm; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #fff; }
            .carton-shipping-box { page-break-after: always; }
            .carton-shipping-box:last-child { page-break-after: avoid; }
          </style>
        </head>
        <body>
          ${container.innerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 250);
              setTimeout(function() {
                if (window.frameElement) window.frameElement.remove();
              }, 4000);
            };
          <\/script>
        </body>
        </html>
      `);
      doc.close();
    } catch (err) {
      console.warn('Iframe print fallback to window.open', err);
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>PMG_Carton_Labels_${activeReturnForLabels ? activeReturnForLabels.doNumber : 'Cartons'}</title>
            <style>
              @page { size: A4 landscape; margin: 8mm; }
              body { margin: 10px; font-family: Arial, sans-serif; background: #fff; }
              .carton-shipping-box { page-break-after: always; }
              .carton-shipping-box:last-child { page-break-after: avoid; }
            </style>
          </head>
          <body>
            ${container.innerHTML}
            <script>
              window.onload = function() {
                window.focus();
                window.print();
              };
            <\/script>
          </body>
          </html>
        `);
        printWin.document.close();
      }
    }
  }

  // ─── MODAL 3: UPLOAD SIGNED DO PROOF (ONEDRIVE INTEGRATION) ───────────────────
  function openUploadSignedDoModal(returnId) {
    const ret = returnsData.find(r => r.id === returnId);
    if (!ret) return;
    activeReturnForUpload = ret;

    const modal = document.getElementById('uploadSignedDoModal');
    if (!modal) return;

    document.getElementById('usdDoNumber').textContent = ret.doNumber;
    document.getElementById('usdBranch').textContent = ret.branch;
    document.getElementById('usdSupplier').textContent = ret.supplier;
    document.getElementById('usdDriverName').value = ret.pickupBy || '';
    document.getElementById('usdPickupDate').value = ret.pickupDate || formatTodayDateForDo();
    document.getElementById('usdFileInput').value = '';
    document.getElementById('usdFileNamePreview').textContent = 'No file selected';

    modal.classList.remove('hidden');
  }

  function closeUploadSignedDoModal() {
    document.getElementById('uploadSignedDoModal')?.classList.add('hidden');
  }

  function handleUsdFileSelected(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const preview = document.getElementById('usdFileNamePreview');
      if (preview) {
        preview.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      }
    }
  }

  async function submitSignedDoProof() {
    if (!activeReturnForUpload) return;

    const fileInput = document.getElementById('usdFileInput');
    const driverName = document.getElementById('usdDriverName').value.trim();
    const pickupDate = document.getElementById('usdPickupDate').value.trim();
    const btn = document.getElementById('usdSubmitBtn');

    if (!fileInput.files || fileInput.files.length === 0) {
      alert('Please select or capture the driver-signed DO document.');
      return;
    }

    const file = fileInput.files[0];
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving to OneDrive…';

    try {
      let savedPath = `Local_${file.name}`;
      let oneDriveSaved = false;

      // Check OneDrive sync engine
      if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveSignedDoProofToOneDrive === 'function') {
        const res = await window.pmgOneDriveSync.saveSignedDoProofToOneDrive(file, activeReturnForUpload.branch, {
          doNumber: activeReturnForUpload.doNumber,
          vendor: activeReturnForUpload.supplier,
          year: new Date().getFullYear(),
          monthFolder: window.pmgOneDriveSync._formatCurrentMonthString ? window.pmgOneDriveSync._formatCurrentMonthString() : '09 - September'
        });

        if (res && res.success) {
          savedPath = res.path;
          oneDriveSaved = true;
        }
      }

      // Update record
      activeReturnForUpload.pickupBy = driverName || 'Transporter Driver';
      activeReturnForUpload.pickupDate = pickupDate || formatTodayDateForDo();
      activeReturnForUpload.status = 'awaiting_cn';
      activeReturnForUpload.signedProof = {
        fileName: file.name,
        path: savedPath,
        oneDriveSynced: oneDriveSaved,
        timestamp: new Date().toISOString()
      };

      await saveSingleReturnToDb(activeReturnForUpload);
      syncReturnsWithOneDrive(activeReturnForUpload.branch);

      closeUploadSignedDoModal();
      renderReturnsUI();
      alert(`✅ Signed DO proof successfully archived to OneDrive!\nStatus updated to: "Awaiting Credit Note".`);
    } catch (err) {
      console.error('[PMG Returns] Proof upload error:', err);
      alert('Error saving signed DO. Please try again.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Upload & Save to OneDrive';
    }
  }

  function viewSignedProof(returnId) {
    const ret = returnsData.find(r => r.id === returnId);
    if (!ret || !ret.signedProof) return;
    alert(`📁 Signed DO Proof Location in OneDrive:\n\nPath: ${ret.signedProof.path}\nFile: ${ret.signedProof.fileName}\nDriver: ${ret.pickupBy || 'N/A'}\nDate: ${ret.pickupDate || 'N/A'}`);
  }

  // ─── MODAL 4: SETTLE CREDIT NOTE & KEY XILNEX SYSTEM ─────────────────────────
  function openSettleCnModal(returnId) {
    const ret = returnsData.find(r => r.id === returnId);
    if (!ret) return;
    activeReturnForCn = ret;

    const modal = document.getElementById('settleCnModal');
    if (!modal) return;

    document.getElementById('scnDoNumber').textContent = ret.doNumber;
    document.getElementById('scnSupplier').textContent = ret.supplier;
    document.getElementById('scnCnNumber').value = ret.cnNumber || '';
    document.getElementById('scnCnAmount').value = ret.cnAmount || '';
    document.getElementById('scnCnDate').value = ret.cnDate || formatTodayDateForDo();
    document.getElementById('scnXilnexChecked').checked = !!ret.xilnexKeyed;
    document.getElementById('scnStaffName').value = ret.xilnexKeyedBy || getCurrentUserDisplayName();

    modal.classList.remove('hidden');
  }

  function closeSettleCnModal() {
    document.getElementById('settleCnModal')?.classList.add('hidden');
  }

  async function submitSettleCn() {
    if (!activeReturnForCn) return;

    const cnNumber = document.getElementById('scnCnNumber').value.trim();
    const cnAmount = parseFloat(document.getElementById('scnCnAmount').value) || 0;
    const cnDate = document.getElementById('scnCnDate').value.trim();
    const xilnexKeyed = document.getElementById('scnXilnexChecked').checked;
    const staffName = document.getElementById('scnStaffName').value.trim();

    if (!cnNumber) {
      alert('Please enter the Supplier Credit Note Number (from the supplier slip).');
      return;
    }

    if (!xilnexKeyed) {
      const confirmProceed = confirm('You have not checked "Keyed into Xilnex". Is this CN already keyed into Xilnex?');
      if (!confirmProceed) return;
    }

    activeReturnForCn.cnNumber = cnNumber;
    activeReturnForCn.cnAmount = cnAmount;
    activeReturnForCn.cnDate = cnDate || formatTodayDateForDo();
    activeReturnForCn.xilnexKeyed = xilnexKeyed;
    activeReturnForCn.xilnexKeyedDate = formatTodayDateForDo();
    activeReturnForCn.xilnexKeyedBy = staffName || getCurrentUserDisplayName();
    activeReturnForCn.status = 'completed';

    await saveSingleReturnToDb(activeReturnForCn);
    syncReturnsWithOneDrive(activeReturnForCn.branch);

    closeSettleCnModal();
    renderReturnsUI();
    alert(`🎉 Credit Note ${cnNumber} marked as Completed & Keyed into Xilnex!`);
  }

  async function deleteReturnRecord(returnId) {
    const ret = returnsData.find(r => r.id === returnId);
    if (!ret) return;

    const confirmDel = confirm(`Are you sure you want to delete return record ${ret.doNumber}? This cannot be undone.`);
    if (!confirmDel) return;

    // 1. Record in tombstone list so cloud sync never resurrects it
    const deletedIds = JSON.parse(localStorage.getItem('pmg_deleted_returns') || '["ret-ks-2609-002"]');
    if (!deletedIds.includes(returnId)) {
      deletedIds.push(returnId);
      localStorage.setItem('pmg_deleted_returns', JSON.stringify(deletedIds));
    }

    // 2. Remove from local memory and IndexedDB
    returnsData = returnsData.filter(r => r.id !== returnId);
    await deleteReturnFromDb(returnId);

    // 3. Directly overwrite OneDrive file with clean array (no re-merging old file)
    if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveReturnsDatabaseToOneDrive === 'function') {
      const branchOnlyData = returnsData.filter(r => (r.branch || '').toUpperCase() === ret.branch.toUpperCase() && !deletedIds.includes(r.id));
      await window.pmgOneDriveSync.saveReturnsDatabaseToOneDrive(ret.branch, branchOnlyData);
    }

    renderReturnsUI();
  }

  // ─── EXPORT TO EXCEL ──────────────────────────────────────────────────────────
  function exportReturnsToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('SheetJS (XLSX) library not loaded. Please check your internet connection.');
      return;
    }

    const rows = [];
    returnsData.forEach(ret => {
      (ret.items || []).forEach(item => {
        rows.push({
          'DO Number': ret.doNumber,
          'DO Date': ret.date,
          'Branch': ret.branch,
          'Supplier': ret.supplier,
          'Total Cartons': ret.totalCartons,
          'Status': ret.status.toUpperCase(),
          'Carton No': item.cartonNo,
          'Item Code': item.itemCode,
          'Item Description': item.itemDescription,
          'Qty': item.quantity,
          'UOM': item.uom,
          'PRN Number': item.prnNumber,
          'Reason': item.reason,
          'Verified By': ret.verifiedBy,
          'Pick Up Driver': ret.pickupBy,
          'Pickup Date': ret.pickupDate,
          'Signed Proof File': ret.signedProof ? ret.signedProof.fileName : 'None',
          'CN Number': ret.cnNumber || '',
          'CN Amount (RM)': ret.cnAmount || 0,
          'CN Date': ret.cnDate || '',
          'Keyed in Xilnex': ret.xilnexKeyed ? 'YES' : 'NO',
          'Xilnex Keyed By': ret.xilnexKeyedBy || ''
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Returns & Credit Notes');

    const fileName = `PMG_Returns_CreditNotes_${getActiveBranchName()}_${new Date().toISOString().substring(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // ─── STRING UTILS ────────────────────────────────────────────────────────────
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ─── EXPOSE TO GLOBAL SCOPE ──────────────────────────────────────────────────
  window.pmgReturns = {
    init: initReturnsModule,
    render: renderReturnsUI,
    setFilter: setReturnsFilter,
    handleSearch: handleReturnsSearch,
    openNewModal: openNewReturnModal,
    closeNewModal: closeNewReturnModal,
    onNrBranchChanged: onNrBranchChanged,
    onDestPresetChanged: onDestPresetChanged,
    addDraftItemRow: addDraftItemRow,
    removeDraftItemRow: removeDraftItemRow,
    updateDraftItem: updateDraftItem,
    autoGroupPrnByThree: autoGroupPrnByThree,
    saveNewReturn: saveNewReturnApplication,
    openPrintDoModal: openPrintDoModal,
    closePrintDoModal: closePrintDoModal,
    executePrintDo: executePrintDo,
    openPrintCartonLabelModal: openPrintCartonLabelModal,
    closePrintCartonLabelModal: closePrintCartonLabelModal,
    executePrintCartonLabels: executePrintCartonLabels,
    onCartonTemplateChanged: onCartonTemplateChanged,
    syncDraftItemsFromDom: syncDraftItemsFromDom,
    getActiveReturnId: () => (activeReturnForDo ? activeReturnForDo.id : null),
    openUploadSignedDoModal: openUploadSignedDoModal,
    closeUploadSignedDoModal: closeUploadSignedDoModal,
    handleUsdFileSelected: handleUsdFileSelected,
    submitSignedDoProof: submitSignedDoProof,
    viewSignedProof: viewSignedProof,
    openSettleCnModal: openSettleCnModal,
    closeSettleCnModal: closeSettleCnModal,
    submitSettleCn: submitSettleCn,
    deleteReturn: deleteReturnRecord,
    exportExcel: exportReturnsToExcel
  };

  // Global convenience aliases
  window.openSettleCnModal = openSettleCnModal;
  window.deleteReturnRecord = deleteReturnRecord;
  window.viewSignedProof = viewSignedProof;
  window.removeDraftItemRow = removeDraftItemRow;

  // Auto-init on page load if container exists
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('content-returns')) {
      initReturnsModule();
    }
  });

})(window);
