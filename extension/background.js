// Drug Expiry Tracker - Background Service Worker

const STORAGE_KEY = 'drug-expiry-tracker-drugs';

// Default drugs for demo purposes (with dates relative to current time)
const defaultDrugs = [
  {
    id: '1',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin Trihydrate',
    manufacturer: 'Pfizer',
    batchNumber: 'AMX-2024-001',
    expiryDate: '2024-12-15', // Expired
    quantity: 500,
    category: 'Antibiotics',
    notes: 'Store in cool, dry place',
    unitPrice: 0.50,
    aliases: ['Amox', 'Amoxil Generic'],
    brandNames: [
      { name: 'Amoxil', manufacturer: 'GSK' },
      { name: 'Trimox', manufacturer: 'Sandoz' }
    ]
  },
  {
    id: '2',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    manufacturer: 'GSK',
    batchNumber: 'PCT-2024-042',
    expiryDate: '2026-02-15', // Expiring soon (within 90 days)
    quantity: 1000,
    category: 'Pain Relief',
    unitPrice: 0.15,
    aliases: ['APAP', 'Acetaminophen'],
    brandNames: [
      { name: 'Tylenol', manufacturer: 'Johnson & Johnson' },
      { name: 'Panadol', manufacturer: 'GSK' }
    ]
  },
  {
    id: '3',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    manufacturer: 'Advil',
    batchNumber: 'IBU-2024-103',
    expiryDate: '2027-03-20', // Safe
    quantity: 750,
    category: 'Pain Relief',
    unitPrice: 0.25,
    aliases: ['IBU'],
    brandNames: [
      { name: 'Advil', manufacturer: 'Pfizer' },
      { name: 'Motrin', manufacturer: 'Johnson & Johnson' }
    ]
  },
  {
    id: '4',
    name: 'Metformin',
    genericName: 'Metformin HCl',
    manufacturer: 'Merck',
    batchNumber: 'MET-2024-055',
    expiryDate: '2026-01-20', // Expiring soon
    quantity: 300,
    category: 'Diabetes',
    notes: 'Monitor blood sugar levels',
    unitPrice: 0.30,
    aliases: ['Met', 'Metformin Hydrochloride'],
    brandNames: [
      { name: 'Glucophage', manufacturer: 'Merck' },
      { name: 'Fortamet', manufacturer: 'Shionogi' }
    ]
  },
  {
    id: '5',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    manufacturer: 'AstraZeneca',
    batchNumber: 'LIS-2024-078',
    expiryDate: '2025-11-25', // Expired
    quantity: 200,
    category: 'Cardiovascular',
    unitPrice: 0.45,
    aliases: ['Lisino', 'ACE Inhibitor'],
    brandNames: [
      { name: 'Zestril', manufacturer: 'AstraZeneca' },
      { name: 'Prinivil', manufacturer: 'Merck' }
    ]
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

// Find matching drugs - now searches aliases and brand names too
function findMatchingDrugs(text, drugs) {
  if (!text || text.length < 3) return [];
  
  const searchText = text.toLowerCase();
  return drugs.filter(drug => {
    const name = drug.name.toLowerCase();
    const genericName = (drug.genericName || '').toLowerCase();
    
    // Check main name and generic name
    if (name.includes(searchText) || 
        searchText.includes(name) ||
        genericName.includes(searchText) ||
        searchText.includes(genericName)) {
      return true;
    }
    
    // Check aliases
    if (drug.aliases && Array.isArray(drug.aliases)) {
      for (const alias of drug.aliases) {
        const aliasLower = alias.toLowerCase();
        if (aliasLower.includes(searchText) || searchText.includes(aliasLower)) {
          return true;
        }
      }
    }
    
    // Check brand names
    if (drug.brandNames && Array.isArray(drug.brandNames)) {
      for (const brand of drug.brandNames) {
        const brandName = (brand.name || '').toLowerCase();
        if (brandName.includes(searchText) || searchText.includes(brandName)) {
          return true;
        }
      }
    }
    
    return false;
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

  if (request.type === 'IMPORT_DRUGS') {
    importDrugs(request.drugs).then(sendResponse);
    return true;
  }

  if (request.type === 'EXPORT_DRUGS') {
    exportDrugs().then(sendResponse);
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
    aliases: drug.aliases || [],
    brandNames: drug.brandNames || [],
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
      aliases: drugData.aliases || drugs[index].aliases || [],
      brandNames: drugData.brandNames || drugs[index].brandNames || [],
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
  const totalValue = drugs.reduce((sum, d) => sum + (d.quantity || 0) * (d.unitPrice || 0), 0);
  const expiringDrugs = drugs.filter(d => d.status === 'expiring');
  const expiringValue = expiringDrugs.reduce((sum, d) => sum + (d.quantity || 0) * (d.unitPrice || 0), 0);
  
  return {
    total: drugs.length,
    expired: drugs.filter(d => d.status === 'expired').length,
    expiring: expiringDrugs.length,
    safe: drugs.filter(d => d.status === 'safe').length,
    totalValue: totalValue.toFixed(2),
    expiringValue: expiringValue.toFixed(2)
  };
}

async function importDrugs(newDrugs) {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const existingDrugs = result[STORAGE_KEY] || [];
  
  const drugsToAdd = newDrugs.map(drug => ({
    ...drug,
    id: crypto.randomUUID(),
    aliases: drug.aliases || [],
    brandNames: drug.brandNames || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  
  const allDrugs = [...existingDrugs, ...drugsToAdd];
  await chrome.storage.local.set({ [STORAGE_KEY]: allDrugs });
  
  return { success: true, count: drugsToAdd.length };
}

async function exportDrugs() {
  const drugs = await getDrugs();
  return drugs;
}