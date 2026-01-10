// Drug Expiry Tracker - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
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

  // Load initial data
  await loadDrugs();
  await loadStats();

  // Event listeners
  addDrugBtn.addEventListener('click', () => openAddModal());
  closeModalBtn.addEventListener('click', () => closeModal());
  cancelBtn.addEventListener('click', () => closeModal());
  closeDeleteModalBtn.addEventListener('click', () => closeDeleteModal());
  cancelDeleteBtn.addEventListener('click', () => closeDeleteModal());
  confirmDeleteBtn.addEventListener('click', () => confirmDelete());
  drugForm.addEventListener('submit', handleSubmit);

  // Close modals on backdrop click
  drugModal.addEventListener('click', (e) => {
    if (e.target === drugModal) closeModal();
  });
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  // Functions
  async function loadDrugs() {
    const drugs = await chrome.runtime.sendMessage({ type: 'GET_DRUGS' });
    renderDrugList(drugs || []);
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

    // Sort by status: expired first, then expiring, then safe
    const statusOrder = { expired: 0, expiring: 1, safe: 2 };
    const sortedDrugs = [...drugs].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    drugList.innerHTML = sortedDrugs.map(drug => {
      const aliasesText = drug.aliases && drug.aliases.length > 0 
        ? `<span class="drug-aliases">Also: ${drug.aliases.slice(0, 2).map(a => escapeHtml(a)).join(', ')}${drug.aliases.length > 2 ? '...' : ''}</span>` 
        : '';
      
      const brandNamesText = drug.brandNames && drug.brandNames.length > 0
        ? `<span class="drug-brands">${drug.brandNames.slice(0, 2).map(b => escapeHtml(b.name)).join(', ')}${drug.brandNames.length > 2 ? '...' : ''}</span>`
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
    }).join('');

    // Add event listeners for action buttons
    drugList.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const action = e.currentTarget.dataset.action;
        const id = e.currentTarget.dataset.id;
        
        if (action === 'edit') {
          const drugs = await chrome.runtime.sendMessage({ type: 'GET_DRUGS' });
          const drug = drugs.find(d => d.id === id);
          if (drug) openEditModal(drug);
        } else if (action === 'delete') {
          const name = e.currentTarget.dataset.name;
          openDeleteModal(id, name);
        }
      });
    });
  }

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
    
    // Handle aliases
    const aliases = drug.aliases && Array.isArray(drug.aliases) ? drug.aliases.join(', ') : '';
    document.getElementById('aliases').value = aliases;
    
    // Handle brand names - format as "Name (Manufacturer)"
    const brandNames = drug.brandNames && Array.isArray(drug.brandNames) 
      ? drug.brandNames.map(b => b.manufacturer ? `${b.name} (${b.manufacturer})` : b.name).join(', ')
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
    await loadDrugs();
    await loadStats();
  }

  // Parse brand names from string format "Name (Manufacturer), Name2 (Manufacturer2)"
  function parseBrandNames(brandNamesStr) {
    if (!brandNamesStr || !brandNamesStr.trim()) return [];
    
    return brandNamesStr.split(',').map(item => {
      const trimmed = item.trim();
      const match = trimmed.match(/^(.+?)\s*\((.+?)\)$/);
      if (match) {
        return { name: match[1].trim(), manufacturer: match[2].trim() };
      }
      return { name: trimmed, manufacturer: '' };
    }).filter(b => b.name);
  }

  // Parse aliases from comma-separated string
  function parseAliases(aliasesStr) {
    if (!aliasesStr || !aliasesStr.trim()) return [];
    return aliasesStr.split(',').map(a => a.trim()).filter(a => a);
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
      brandNames: parseBrandNames(document.getElementById('brand-names').value)
    };

    if (id) {
      await chrome.runtime.sendMessage({ type: 'UPDATE_DRUG', id, drug: drugData });
    } else {
      await chrome.runtime.sendMessage({ type: 'ADD_DRUG', drug: drugData });
    }

    closeModal();
    await loadDrugs();
    await loadStats();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});