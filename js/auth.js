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
  const headerBranchSelector = document.getElementById('branchSelector');
  const amBadge = document.getElementById('amBranchSwitcher');

  if (tabAudit) tabAudit.style.display = isAM ? '' : 'none';
  if (auditContent && !isAM) auditContent.classList.add('hidden');
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
}

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
          matchedUser = {
            username:    row.Username,
            displayName: row.DisplayName || row.Username,
            branch:      row.AssignedBranch || 'ALL',
            role:        (row.Role || 'BM').toUpperCase(),
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
      matchedUser = {
        username:    found.username,
        displayName: found.displayName,
        branch:      found.branch,
        role:        found.role,
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
  ['mainHeader', 'mainNav', 'mainContent'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  });
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
