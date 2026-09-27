// js/auth.js — Authentication & Session Management
'use strict';

// ─── SESSION ──────────────────────────────────────────────────────────────────
const SESSION_KEY = 'pmg_session';

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ─── ROLE-BASED UI CONTROL ────────────────────────────────────────────────────
function applyRoleUI(session) {
  const role = session.role;
  const isAM = role === 'AM';

  // Show / hide tabs based on role
  const tabAudit = document.getElementById('tab-audit');
  const auditContent = document.getElementById('content-audit');
  const tabPatient = document.getElementById('tab-patient');
  const patientContent = document.getElementById('content-patient');
  const headerBranchSelector = document.getElementById('branchSelector');
  const amBadge = document.getElementById('amBranchSwitcher');

  if (tabAudit) tabAudit.style.display = isAM ? '' : 'none';
  if (auditContent && !isAM) auditContent.classList.add('hidden');
  if (tabPatient) tabPatient.style.display = isAM ? '' : 'none';
  if (patientContent && !isAM) patientContent.classList.add('hidden');
  if (headerBranchSelector) headerBranchSelector.style.display = isAM ? '' : 'none';
  if (amBadge) amBadge.style.display = isAM ? '' : 'none';

  // Populate branch selector for AM
  if (isAM && headerBranchSelector) {
    headerBranchSelector.innerHTML = '<option value="">All Branches</option>';
    BRANCHES.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.code;
      opt.textContent = `${b.code} – ${b.name}`;
      headerBranchSelector.appendChild(opt);
    });

    const savedGlobalBranch = localStorage.getItem('pmg_global_branch');
    if (savedGlobalBranch) {
      headerBranchSelector.value = savedGlobalBranch;
    }

    headerBranchSelector.onchange = (e) => {
      setGlobalActiveBranch(e.target.value);
    };
  }

  // Update header user display
  const userSpan = document.getElementById('loggedInUser');
  if (userSpan) {
    const branchLabel = session.branch === 'ALL' ? 'All Branches' : session.branch;
    userSpan.textContent = `${session.displayName} · ${branchLabel} · ${role}`;
  }

  // Update active branch badge in roster module
  const badge = document.getElementById('activeBranchBadge');
  if (badge) {
    badge.textContent = session.branch === 'ALL' ? 'Area Manager – All Branches' : session.branch;
  }

  // Pre-fill roster branch input
  const rosterBranchInput = document.getElementById('rosterBranchCode');
  if (rosterBranchInput && session.branch !== 'ALL') {
    const bObj = BRANCHES.find(b => b.name === session.branch || b.code === session.branch);
    if (bObj) rosterBranchInput.value = bObj.code;
  }

  // Pre-fill stock expiry branch filter
  const expBranchFilter = document.getElementById('expiryBranchFilter');
  if (expBranchFilter && session.branch && session.branch !== 'ALL') {
    expBranchFilter.value = session.branch;
    if (typeof activeExpiryFilter !== 'undefined') {
      activeExpiryFilter.branch = session.branch;
    }
  }

  // Apply saved global branch if AM
  if (isAM) {
    const saved = localStorage.getItem('pmg_global_branch');
    if (saved) {
      setTimeout(() => setGlobalActiveBranch(saved), 300);
    }
  }
}

// ─── GLOBAL ACTIVE BRANCH SYNCHRONIZATION ────────────────────────────────────
function setGlobalActiveBranch(branchCodeOrName) {
  const inputStr = (branchCodeOrName || '').trim();
  const inputUpper = inputStr.toUpperCase();

  let bObj = null;
  if (typeof BRANCHES !== 'undefined' && Array.isArray(BRANCHES)) {
    bObj = BRANCHES.find(b => b.code.toUpperCase() === inputUpper || b.name.toUpperCase() === inputUpper);
  }

  const branchCode = bObj ? bObj.code : (inputUpper === 'ALL' || !inputStr ? '' : inputStr);
  const branchName = bObj ? bObj.name : (inputUpper === 'ALL' || !inputStr ? '' : inputStr);

  // 1. Top Header Selector
  const headerSel = document.getElementById('branchSelector');
  if (headerSel && headerSel.value !== branchCode) {
    headerSel.value = branchCode;
  }

  // 2. Patient Care & Appointments (Module 3)
  const patientSel = document.getElementById('patientBranchFilter');
  if (patientSel) {
    patientSel.value = branchCode;
    if (typeof renderPatientModule === 'function') {
      renderPatientModule();
    }
  }

  // 3. AI Smart Timetable Generator (Area Manager Suite)
  const schedulerSel = document.getElementById('schedulerBranchSelect');
  if (schedulerSel) {
    if (branchCode) {
      schedulerSel.value = branchCode;
    }
    if (typeof loadTeammates === 'function') {
      loadTeammates(schedulerSel.value || 'KS01');
    }
  }

  // 4. Stock Expiry Tracker (Module 5)
  const expirySel = document.getElementById('expiryBranchFilter');
  if (expirySel) {
    expirySel.value = branchName;
    if (typeof activeExpiryFilter !== 'undefined') {
      activeExpiryFilter.branch = branchName;
      if (typeof renderExpiryUI === 'function') {
        renderExpiryUI();
      }
    }
    if (typeof updateAccountsShareUi === 'function') {
      updateAccountsShareUi(branchName || 'Kota Sentosa');
    }
  }

  // 5. Credit Note & Returns Tracker (Module 6)
  const returnsSel = document.getElementById('returnsBranchFilter');
  if (returnsSel) {
    returnsSel.value = branchName;
    if (window.pmgReturns && typeof window.pmgReturns.render === 'function') {
      window.pmgReturns.render();
    } else if (typeof renderReturnsUI === 'function') {
      renderReturnsUI();
    }
  }

  // 6. OneDrive Sync Active Branch
  if (window.pmgOneDriveSync) {
    if (branchName) {
      window.pmgOneDriveSync.activeBranchFolder = branchName.toUpperCase();
    }
    if (typeof updateSyncModalInfo === 'function') {
      updateSyncModalInfo();
    }
  }

  // Persist choice for Area Manager
  localStorage.setItem('pmg_global_branch', branchCode);

  const displayName = branchName ? `${branchCode} – ${branchName}` : 'All Branches (AM Overview)';
  if (typeof showExpiryToast === 'function') {
    showExpiryToast(`Switched active view to: ${displayName}`);
  }
}
window.setGlobalActiveBranch = setGlobalActiveBranch;

// ─── LOGIN HANDLER ────────────────────────────────────────────────────────────
async function login() {
  const usernameEl = document.getElementById('loginUsername');
  const passwordEl = document.getElementById('loginPassword');
  const errorEl    = document.getElementById('loginError');
  const loginBtn   = document.getElementById('loginBtn');

  const username = usernameEl.value.trim();
  const password = passwordEl.value.trim();

  if (!username || !password) {
    showLoginError('Please enter both username and password.');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="loader-sm border-2 border-white border-t-blue-300 rounded-full w-4 h-4 inline-block animate-spin mr-2"></span>Verifying...';

  let matchedUser = null;

  // 1. Try remote CSV (public Google Sheets export)
  try {
    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/PLACEHOLDER/pub?output=csv';
    const resp = await Promise.race([
      fetch(SHEET_CSV_URL),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    if (resp.ok) {
      const text = await resp.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      for (const row of parsed.data) {
        if (row.Username && row.Username.toLowerCase() === username.toLowerCase() &&
            String(row.Password).trim() === String(password).trim()) {
          const branchVal = row.AssignedBranch || row.Branch || '';
          const isAM = (row.Role && row.Role.toUpperCase() === 'AM') ||
                       branchVal.toUpperCase() === 'ALL' ||
                       row.Username.toLowerCase() === 'williamchai' ||
                       row.Username.toLowerCase() === 'am';
          matchedUser = {
            username:    row.Username,
            displayName: row.DisplayName || row.Username,
            branch:      branchVal || 'ALL',
            role:        isAM ? 'AM' : 'BM',
          };
          break;
        }
      }
    }
  } catch (_) {
    // Remote unavailable — fall through to local
  }

  // 2. Fallback: local USERS array from data.js
  if (!matchedUser) {
    const found = USERS.find(u =>
      u.username.toLowerCase() === username.toLowerCase() &&
      String(u.password).trim() === String(password).trim()
    );
    if (found) {
      const isAM = found.role === 'AM' ||
                   found.branch === 'ALL' ||
                   found.username.toLowerCase() === 'williamchai' ||
                   found.username.toLowerCase() === 'am';
      matchedUser = {
        username:    found.username,
        displayName: found.displayName,
        branch:      found.branch,
        role:        isAM ? 'AM' : (found.role || 'BM'),
      };
    }
  }

  loginBtn.disabled = false;
  loginBtn.innerHTML = '<span>Login</span>';

  if (!matchedUser) {
    showLoginError('Invalid username or password. Please try again.');
    passwordEl.value = '';
    passwordEl.focus();
    return;
  }

  // Store session and show main app
  setSession(matchedUser);
  hideAuthOverlay();
  applyRoleUI(matchedUser);
  showMainApp();
  switchTab('inventory');
}

function showLoginError(msg) {
  const el = document.getElementById('loginError');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

function hideAuthOverlay() {
  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.classList.add('hidden');
}

function showMainApp() {
  ['mainHeader', 'mainNav', 'mainContent', 'mainFooter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  });

  // Update branch badge in inventory
  const session = getSession();
  if (session) {
    const badge = document.getElementById('invBranchBadge');
    if (badge) badge.textContent = session.branch === 'ALL' ? 'All Branches' : session.branch;
  }
}

function logout() {
  clearSession();
  location.reload();
}

// ─── BOOT: check existing session ─────────────────────────────────────────────
function bootAuth() {
  const session = getSession();
  if (session) {
    hideAuthOverlay();
    applyRoleUI(session);
    showMainApp();
    switchTab('inventory');
  } else {
    // Wire enter key on login form
    ['loginUsername', 'loginPassword'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
    });
  }
}
