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
      opt.textContent = (b.code && b.code !== b.name && b.code.length <= 5) ? `${b.code} – ${b.name}` : b.name;
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
  if (expBranchFilter) {
    if (session.branch && session.branch !== 'ALL') {
      expBranchFilter.value = session.branch;
      expBranchFilter.disabled = true;
      if (typeof activeExpiryFilter !== 'undefined') {
        activeExpiryFilter.branch = session.branch;
      }
    } else {
      expBranchFilter.disabled = false;
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
// Connects to live PMG Master Staff in Google Sheets (shared with PMG Sales WebApp)
const PMG_MASTER_AUTH_URL = 'https://script.google.com/macros/s/AKfycbwhxfd5OQrDJw3bYPuzCd8DQqhWfOmtkQpQUTu7ke9s2bE_egFmvWeubaEtjMvBzADS/exec';

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
  loginBtn.innerHTML = '<span class="loader-sm border-2 border-white border-t-blue-300 rounded-full w-4 h-4 inline-block animate-spin mr-2"></span>Connecting to Master Staff...';

  let matchedUser = null;
  let accessDeniedMessage = null;

  // 1. Live Authentication via PMG Master Staff Cloud Relay (Google Sheets API)
  try {
    const resp = await Promise.race([
      fetch(PMG_MASTER_AUTH_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'login', username, password })
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 7000))
    ]);

    if (resp.ok) {
      const result = await resp.json();
      if (result.success && result.user) {
        const u = result.user;
        const rawRole = (u.position || u.role || '').trim();
        const roleLower = rawRole.toLowerCase();

        // ── ROLE-BASED ACCESS CONTROL FOR PMG MANAGEMENT HUB ──
        // • Area Manager: Full access across all 6 modules & all branches
        // • Branch Manager / ABM: Inventory, Roster (Rymnet), Stock Expiry, Record CN (PRN/DO)
        // • Pharmacist: Inventory, Roster (Rymnet), Stock Expiry, Record CN (PRN/DO) (Patient Care hidden - pilot stage)
        // • Staff (normal assistant), Nutritionist, Dietitian: RESTRICTED to PMG Sales WebApp only!
        if (roleLower === 'area manager' || roleLower === 'am' || u.username.toLowerCase() === 'williamchai') {
          matchedUser = {
            username:    u.username,
            displayName: u.name || u.username,
            branch:      (u.branch && u.branch.toUpperCase() !== 'ALL') ? u.branch : 'ALL',
            role:        'AM',
            position:    'Area Manager',
            empId:       u.empId || '',
          };
        } else if (roleLower.includes('manager') || roleLower === 'bm' || roleLower === 'abm') {
          matchedUser = {
            username:    u.username,
            displayName: u.name || u.username,
            branch:      u.branch || 'Kota Sentosa',
            role:        'BM',
            position:    rawRole,
            empId:       u.empId || '',
          };
        } else if (roleLower.includes('pharmacist')) {
          matchedUser = {
            username:    u.username,
            displayName: u.name || u.username,
            branch:      u.branch || 'Kota Sentosa',
            role:        'Pharmacist',
            position:    'Pharmacist',
            empId:       u.empId || '',
          };
        } else {
          // Staff (Normal Pharmacist Assistant), Nutritionist, Dietitian
          accessDeniedMessage = `Access Restricted: ${u.name || u.username} (${rawRole}) is authorized for the PMG Sales WebApp only. PMG Management Hub is restricted to Area Managers, Branch Managers, and Pharmacists.`;
        }
      } else if (result.message) {
        if (result.message.toLowerCase().includes('pending') || result.message.toLowerCase().includes('inactive')) {
          accessDeniedMessage = result.message;
        }
      }
    }
  } catch (err) {
    console.warn('[Auth] Remote verification unavailable or timed out, trying local fallback:', err);
  }

  // If remote returned an explicit restriction or pending status, inform the user immediately
  if (accessDeniedMessage) {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<span>Sign In</span>';
    showLoginError(accessDeniedMessage);
    passwordEl.value = '';
    return;
  }

  // 2. Offline Fallback: local USERS array from data.js
  if (!matchedUser) {
    const found = USERS.find(u =>
      u.username.toLowerCase() === username.toLowerCase() &&
      String(u.password).trim() === String(password).trim()
    );
    if (found) {
      const rawRole = (found.position || found.role || '').trim();
      const roleLower = rawRole.toLowerCase();

      // Check role restriction in offline mode too
      if (roleLower === 'staff' || roleLower === 'nutritionist' || roleLower === 'dietitian') {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Sign In</span>';
        showLoginError(`Access Restricted: ${found.displayName || found.username} (${rawRole}) is authorized for the PMG Sales WebApp only.`);
        passwordEl.value = '';
        return;
      }

      const isAM = roleLower === 'am' ||
                   roleLower === 'area manager' ||
                   found.branch === 'ALL' ||
                   found.username.toLowerCase() === 'williamchai' ||
                   found.username.toLowerCase() === 'am';

      const isBM = roleLower === 'bm' || roleLower === 'abm' || roleLower.includes('manager');
      const isPharm = roleLower.includes('pharmacist');

      matchedUser = {
        username:    found.username,
        displayName: found.displayName || found.username,
        branch:      found.branch || (isAM ? 'ALL' : 'Kota Sentosa'),
        role:        isAM ? 'AM' : (isPharm ? 'Pharmacist' : 'BM'),
        position:    rawRole || (isAM ? 'Area Manager' : (isPharm ? 'Pharmacist' : 'Branch Manager')),
        empId:       found.empNo || '',
      };
    }
  }

  loginBtn.disabled = false;
  loginBtn.innerHTML = '<span>Sign In</span>';

  if (!matchedUser) {
    showLoginError('Invalid username or password. Please verify your credentials or ensure your account is approved in PMG Master Staff.');
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
