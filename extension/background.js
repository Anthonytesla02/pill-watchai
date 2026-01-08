// Drug Expiry Tracker - Background Service Worker

const STORAGE_KEY = 'drug-expiry-tracker-drugs';

// Default drugs for demo purposes
const defaultDrugs = [
  {
    id: '1',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin Trihydrate',
    manufacturer: 'Pfizer',
    batchNumber: 'AMX-2024-001',
    expiryDate: '2024-02-15',
    quantity: 500,
    category: 'Antibiotics',
    notes: 'Store in cool, dry place'
  },
  {
    id: '2',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    manufacturer: 'GSK',
    batchNumber: 'PCT-2024-042',
    expiryDate: '2025-06-30',
    quantity: 1000,
    category: 'Pain Relief'
  },
  {
    id: '3',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    manufacturer: 'Advil',
    batchNumber: 'IBU-2024-103',
    expiryDate: '2026-03-20',
    quantity: 750,
    category: 'Pain Relief'
  },
  {
    id: '4',
    name: 'Metformin',
    genericName: 'Metformin HCl',
    manufacturer: 'Merck',
    batchNumber: 'MET-2024-055',
    expiryDate: '2025-01-10',
    quantity: 300,
    category: 'Diabetes',
    notes: 'Monitor blood sugar levels'
  },
  {
    id: '5',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    manufacturer: 'AstraZeneca',
    batchNumber: 'LIS-2024-078',
    expiryDate: '2025-08-25',
    quantity: 200,
    category: 'Cardiovascular'
  }
];

// Initialize storage with default drugs if empty
chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  if (!result[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: defaultDrugs });
    console.log('Drug Expiry Tracker: Initialized with default drugs');
  }
});

// Get drug status based on expiry date
function getDrugStatus(expiryDate) {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 90) return 'expiring';
  return 'safe';
}

// Format days until expiry
function formatDaysUntilExpiry(expiryDate) {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (days < 0) return `Expired ${Math.abs(days)} days ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `Expires in ${days} days`;
}

// Find matching drugs
function findMatchingDrugs(text, drugs) {
  if (!text || text.length < 3) return [];
  
  const searchText = text.toLowerCase();
  return drugs.filter(drug => {
    const name = drug.name.toLowerCase();
    const genericName = (drug.genericName || '').toLowerCase();
    return name.includes(searchText) || 
           searchText.includes(name) ||
           genericName.includes(searchText) ||
           searchText.includes(genericName);
  });
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_DRUG') {
    handleDrugCheck(request.text).then(sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (request.type === 'GET_DRUGS') {
    getDrugs().then(sendResponse);
    return true;
  }
  
  if (request.type === 'ADD_DRUG') {
    addDrug(request.drug).then(sendResponse);
    return true;
  }
  
  if (request.type === 'UPDATE_DRUG') {
    updateDrug(request.id, request.drug).then(sendResponse);
    return true;
  }
  
  if (request.type === 'DELETE_DRUG') {
    deleteDrug(request.id).then(sendResponse);
    return true;
  }
  
  if (request.type === 'GET_STATS') {
    getStats().then(sendResponse);
    return true;
  }
});

async function handleDrugCheck(text) {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const drugs = result[STORAGE_KEY] || [];
  const matches = findMatchingDrugs(text, drugs);
  
  return matches.map(drug => ({
    ...drug,
    status: getDrugStatus(drug.expiryDate),
    statusText: formatDaysUntilExpiry(drug.expiryDate)
  }));
}

async function getDrugs() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const drugs = result[STORAGE_KEY] || [];
  return drugs.map(drug => ({
    ...drug,
    status: getDrugStatus(drug.expiryDate),
    statusText: formatDaysUntilExpiry(drug.expiryDate)
  }));
}

async function addDrug(drug) {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const drugs = result[STORAGE_KEY] || [];
  const newDrug = {
    ...drug,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  drugs.push(newDrug);
  await chrome.storage.local.set({ [STORAGE_KEY]: drugs });
  return newDrug;
}

async function updateDrug(id, drugData) {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const drugs = result[STORAGE_KEY] || [];
  const index = drugs.findIndex(d => d.id === id);
  if (index !== -1) {
    drugs[index] = { 
      ...drugs[index], 
      ...drugData, 
      updatedAt: new Date().toISOString() 
    };
    await chrome.storage.local.set({ [STORAGE_KEY]: drugs });
    return drugs[index];
  }
  return null;
}

async function deleteDrug(id) {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const drugs = result[STORAGE_KEY] || [];
  const filtered = drugs.filter(d => d.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
  return { success: true };
}

async function getStats() {
  const drugs = await getDrugs();
  return {
    total: drugs.length,
    expired: drugs.filter(d => d.status === 'expired').length,
    expiring: drugs.filter(d => d.status === 'expiring').length,
    safe: drugs.filter(d => d.status === 'safe').length
  };
}
