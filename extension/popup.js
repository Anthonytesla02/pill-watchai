// Drug Expiry Tracker - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const mainUi = document.getElementById('main-ui');

  // Auth UI
  const authSignedOut = document.getElementById('auth-signed-out');
  const authSignedIn = document.getElementById('auth-signed-in');
  const authForm = document.getElementById('auth-form');
  const authEmail = document.getElementById('auth-email');
  const authPassword = document.getElementById('auth-password');
  const authError = document.getElementById('auth-error');
  const btnLocalMode = document.getElementById('btn-local-mode');
  const btnSignOut = document.getElementById('btn-sign-out');
  const btnSync = document.getElementById('btn-sync');

  // Stats
  const drugList = document.getElementById('drug-list');
  const totalCount = document.getElementById('total-count');
  const expiredCount = document.getElementById('expired-count');
  const expiringCount = document.getElementById('expiring-count');
  const safeCount = document.getElementById('safe-count');
  const totalValue = document.getElementById('total-value');
  const expiringValue = document.getElementById('expiring-value');

  // Modal elements
  const drugModal = document.getElementById('drug-modal');
  const deleteModal = document.getElementById('delete-modal');
  const drugForm = document.getElementById('drug-form');
  const modalTitle = document.getElementById('modal-title');
  const addDrugBtn = document.getElementById('add-drug-btn');
  const closeModalBtn = document.getElementById('close-modal');
  const cancelBtn = document.getElementById('cancel-btn');
  const closeDeleteModalBtn = document.getElementById('close-delete-modal');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const deleteDrugName = document.getElementById('delete-drug-name');

  let currentDeleteId = null;

  // -----
  // Auth + Mode
  // -----

  function setAuthError(message) {
    authError.textContent = message || '';
    authError.style.display = message ? 'block' : 'none';
  }

  async function refreshAuthState() {
    const state = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' });
    const signedIn = !!state?.signedIn && state?.mode === 'cloud';

    authSignedOut.style.display = signedIn ? 'none' : 'block';
    authSignedIn.style.display = signedIn ? 'block' : 'none';
    mainUi.style.display = 'block'; // always show UI; data source depends on mode

    if (signedIn) {
      setAuthError('');
      await reloadAll();
    } else {
      // in local mode (or signed out)
      await reloadAll();
    }
  }

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAuthError('');

    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (!email || !password) {
      setAuthError('Email and password are required.');
      return;
    }

    const btn = document.getElementById('btn-sign-in');
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
      const res = await chrome.runtime.sendMessage({ type: 'SIGN_IN', email, password });
      if (!res?.ok) {
        setAuthError(res?.error || 'Sign in failed.');
      }
    } catch (err) {
      setAuthError(err?.message || 'Sign in failed.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign in';
      authPassword.value = '';
      await refreshAuthState();
    }
  });

  btnLocalMode.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'SET_MODE', mode: 'local' });
    setAuthError('');
    await refreshAuthState();
  });

  btnSignOut.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'SIGN_OUT' });
    setAuthError('');
    await refreshAuthState();
  });

  btnSync.addEventListener('click', async () => {
    await reloadAll();
  });

  // -----
  // Data rendering
  // -----

  async function reloadAll() {
    await loadDrugs();
    await loadStats();
  }

  async function loadDrugs() {
    const drugs = await chrome.runtime.sendMessage({ type: 'GET_DRUGS' });
    renderDrugList(Array.isArray(drugs) ? drugs : []);
  }

  async function loadStats() {
    const stats = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
    if (stats) {
      totalCount.textContent = stats.total;
      expiredCount.textContent = stats.expired;
      expiringCount.textContent = stats.expiring;
      safeCount.textContent = stats.safe;
      totalValue.textContent = `$${stats.totalValue || '0.00'}`;
      expiringValue.textContent = `$${stats.expiringValue || '0.00'}`;
    }
  }

  function renderDrugList(drugs) {
    if (drugs.length === 0) {
      drugList.innerHTML = `
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.5 20.5L10 14l-7-7 7-7 7 7-7 7z"/>
            <path d="M17.5 3.5L21 7l-7 7"/>
          </svg>
          <p>No drugs in inventory</p>
          <p style="font-size: 11px;">Click "Add" to add your first drug</p>
        </div>
      `;
      return;
    }

    const statusOrder = { expired: 0, expiring: 1, safe: 2 };
    const sortedDrugs = [...drugs].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    drugList.innerHTML = sortedDrugs
      .map((drug) => {
        const aliasesText =
          drug.aliases && drug.aliases.length > 0
            ? `<span class="drug-aliases">Also: ${drug.aliases
                .slice(0, 2)
                .map((a) => escapeHtml(a))
                .join(', ')}${drug.aliases.length > 2 ? '...' : ''}</span>`
            : '';

        const brandNamesText =
          drug.brandNames && drug.brandNames.length > 0
            ? `<span class="drug-brands">${drug.brandNames
                .slice(0, 2)
                .map((b) => escapeHtml(b.name))
                .join(', ')}${drug.brandNames.length > 2 ? '...' : ''}</span>`
            : '';

        return `
        <div class="drug-item" data-id="${drug.id}">
          <div class="drug-info">
            <div class="drug-status-indicator ${drug.status}"></div>
            <div class="drug-details">
              <div class="drug-name">${escapeHtml(drug.name)}</div>
              <div class="drug-meta">${drug.statusText} • ${escapeHtml(drug.batchNumber)}</div>
              ${aliasesText || brandNamesText ? `<div class="drug-extra">${aliasesText}${brandNamesText}</div>` : ''}
            </div>
          </div>
          <div class="drug-actions">
            <button class="btn-icon edit" title="Edit" data-action="edit" data-id="${drug.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-icon delete" title="Delete" data-action="delete" data-id="${drug.id}" data-name="${escapeHtml(drug.name)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      `;
      })
      .join('');

    drugList.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const action = e.currentTarget.dataset.action;
        const id = e.currentTarget.dataset.id;

        if (action === 'edit') {
          const drugs = await chrome.runtime.sendMessage({ type: 'GET_DRUGS' });
          const drug = Array.isArray(drugs) ? drugs.find((d) => d.id === id) : null;
          if (drug) openEditModal(drug);
        } else if (action === 'delete') {
          const name = e.currentTarget.dataset.name;
          openDeleteModal(id, name);
        }
      });
    });
  }

  // -----
  // Modals + CRUD
  // -----

  addDrugBtn.addEventListener('click', () => openAddModal());
  closeModalBtn.addEventListener('click', () => closeModal());
  cancelBtn.addEventListener('click', () => closeModal());
  closeDeleteModalBtn.addEventListener('click', () => closeDeleteModal());
  cancelDeleteBtn.addEventListener('click', () => closeDeleteModal());
  confirmDeleteBtn.addEventListener('click', () => confirmDelete());
  drugForm.addEventListener('submit', handleSubmit);

  drugModal.addEventListener('click', (e) => {
    if (e.target === drugModal) closeModal();
  });
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  function openAddModal() {
    modalTitle.textContent = 'Add Drug';
    drugForm.reset();
    document.getElementById('drug-id').value = '';
    drugModal.classList.add('active');
  }

  function openEditModal(drug) {
    modalTitle.textContent = 'Edit Drug';
    document.getElementById('drug-id').value = drug.id;
    document.getElementById('drug-name').value = drug.name;
    document.getElementById('generic-name').value = drug.genericName || '';
    document.getElementById('batch-number').value = drug.batchNumber;
    document.getElementById('expiry-date').value = drug.expiryDate;
    document.getElementById('manufacturer').value = drug.manufacturer || '';
    document.getElementById('quantity').value = drug.quantity || '';
    document.getElementById('unit-price').value = drug.unitPrice || '';
    document.getElementById('category').value = drug.category || '';
    document.getElementById('notes').value = drug.notes || '';

    const aliases = drug.aliases && Array.isArray(drug.aliases) ? drug.aliases.join(', ') : '';
    document.getElementById('aliases').value = aliases;

    const brandNames =
      drug.brandNames && Array.isArray(drug.brandNames)
        ? drug.brandNames
            .map((b) => (b.manufacturer ? `${b.name} (${b.manufacturer})` : b.name))
            .join(', ')
        : '';
    document.getElementById('brand-names').value = brandNames;

    drugModal.classList.add('active');
  }

  function closeModal() {
    drugModal.classList.remove('active');
    drugForm.reset();
  }

  function openDeleteModal(id, name) {
    currentDeleteId = id;
    deleteDrugName.textContent = name;
    deleteModal.classList.add('active');
  }

  function closeDeleteModal() {
    deleteModal.classList.remove('active');
    currentDeleteId = null;
  }

  async function confirmDelete() {
    if (!currentDeleteId) return;
    await chrome.runtime.sendMessage({ type: 'DELETE_DRUG', id: currentDeleteId });
    closeDeleteModal();
    await reloadAll();
  }

  function parseBrandNames(brandNamesStr) {
    if (!brandNamesStr || !brandNamesStr.trim()) return [];

    return brandNamesStr
      .split(',')
      .map((item) => {
        const trimmed = item.trim();
        const match = trimmed.match(/^(.+?)\s*\((.+?)\)$/);
        if (match) {
          return { name: match[1].trim(), manufacturer: match[2].trim() };
        }
        return { name: trimmed, manufacturer: '' };
      })
      .filter((b) => b.name);
  }

  function parseAliases(aliasesStr) {
    if (!aliasesStr || !aliasesStr.trim()) return [];
    return aliasesStr
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('drug-id').value;
    const drugData = {
      name: document.getElementById('drug-name').value.trim(),
      genericName: document.getElementById('generic-name').value.trim(),
      batchNumber: document.getElementById('batch-number').value.trim(),
      expiryDate: document.getElementById('expiry-date').value,
      manufacturer: document.getElementById('manufacturer').value.trim(),
      quantity: parseInt(document.getElementById('quantity').value) || 0,
      unitPrice: parseFloat(document.getElementById('unit-price').value) || 0,
      category: document.getElementById('category').value,
      notes: document.getElementById('notes').value.trim(),
      aliases: parseAliases(document.getElementById('aliases').value),
      brandNames: parseBrandNames(document.getElementById('brand-names').value),
    };

    if (id) {
      await chrome.runtime.sendMessage({ type: 'UPDATE_DRUG', id, drug: drugData });
    } else {
      await chrome.runtime.sendMessage({ type: 'ADD_DRUG', drug: drugData });
    }

    closeModal();
    await reloadAll();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Init
  await refreshAuthState();
});
