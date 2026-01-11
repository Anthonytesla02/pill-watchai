// Drug Expiry Tracker - Background Service Worker (MV3 module)
// Local mode (no account) + Cloud Sync mode (requires sign-in)

const STORAGE_KEYS = {
  mode: 'det_mode', // 'local' | 'cloud'
  localDrugs: 'drug-expiry-tracker-drugs',
  session: 'det_session',
  cache: 'det_cloud_cache', // { fetchedAt: number, drugs: Drug[] }
};

// Lovable Cloud public config (publishable)
const PROJECT_REF = 'charyczlgezmcfdycszz';
const BACKEND_URL = `https://${PROJECT_REF}.supabase.co`;
const PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoYXJ5Y3psZ2V6bWNmZHljc3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjk1MjYsImV4cCI6MjA4MzY0NTUyNn0.5DRDkaJKIwD2Blzp4L7GfTNC5-5gyySdt6ThxLv2K70';

// Default drugs for demo purposes (local mode)
const defaultDrugs = [
  {
    id: '1',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin Trihydrate',
    manufacturer: 'Pfizer',
    batchNumber: 'AMX-2024-001',
    expiryDate: '2024-12-15',
    quantity: 500,
    category: 'Antibiotics',
    notes: 'Store in cool, dry place',
    unitPrice: 0.5,
    aliases: ['Amox', 'Amoxil Generic'],
    brandNames: [
      { name: 'Amoxil', manufacturer: 'GSK' },
      { name: 'Trimox', manufacturer: 'Sandoz' },
    ],
  },
];

chrome.runtime.onInstalled.addListener(async () => {
  const [{ [STORAGE_KEYS.localDrugs]: drugs }, { [STORAGE_KEYS.mode]: mode }] =
    await Promise.all([
      chrome.storage.local.get(STORAGE_KEYS.localDrugs),
      chrome.storage.local.get(STORAGE_KEYS.mode),
    ]);

  if (!drugs) {
    await chrome.storage.local.set({ [STORAGE_KEYS.localDrugs]: defaultDrugs });
  }
  if (!mode) {
    await chrome.storage.local.set({ [STORAGE_KEYS.mode]: 'local' });
  }
});

// -----------------------------
// Helpers (shared)
// -----------------------------

function getDrugStatus(expiryDate) {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 90) return 'expiring';
  return 'safe';
}

function formatDaysUntilExpiry(expiryDate) {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) return `Expired ${Math.abs(days)} days ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `Expires in ${days} days`;
}

function decorateDrug(drug) {
  const status = getDrugStatus(drug.expiryDate);
  return {
    ...drug,
    status,
    statusText: formatDaysUntilExpiry(drug.expiryDate),
  };
}

function normalizeText(text) {
  return (text || '').toLowerCase().trim();
}

function findMatchingDrugs(text, drugs) {
  if (!text || text.length < 3) return [];

  const searchText = normalizeText(text);
  return drugs.filter((drug) => {
    const name = normalizeText(drug.name);
    const genericName = normalizeText(drug.genericName);

    if (
      name.includes(searchText) ||
      searchText.includes(name) ||
      (genericName && (genericName.includes(searchText) || searchText.includes(genericName)))
    ) {
      return true;
    }

    if (drug.aliases && Array.isArray(drug.aliases)) {
      for (const alias of drug.aliases) {
        const aliasLower = normalizeText(alias);
        if (aliasLower && (aliasLower.includes(searchText) || searchText.includes(aliasLower))) return true;
      }
    }

    if (drug.brandNames && Array.isArray(drug.brandNames)) {
      for (const brand of drug.brandNames) {
        const brandName = normalizeText(brand?.name);
        if (brandName && (brandName.includes(searchText) || searchText.includes(brandName))) return true;
      }
    }

    return false;
  });
}

async function getMode() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.mode);
  return result[STORAGE_KEYS.mode] || 'local';
}

async function setMode(mode) {
  await chrome.storage.local.set({ [STORAGE_KEYS.mode]: mode });
  return { mode };
}

// -----------------------------
// Cloud Auth + REST calls
// -----------------------------

async function getStoredSession() {
  const { [STORAGE_KEYS.session]: session } = await chrome.storage.local.get(STORAGE_KEYS.session);
  return session || null;
}

async function saveSession(session) {
  await chrome.storage.local.set({ [STORAGE_KEYS.session]: session });
}

async function clearSession() {
  await chrome.storage.local.remove([STORAGE_KEYS.session, STORAGE_KEYS.cache]);
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

async function refreshSessionIfNeeded(session) {
  if (!session) return null;
  if (!session.expires_at) return session;

  // refresh when within 60s of expiry
  if (session.expires_at - nowSec() > 60) return session;

  if (!session.refresh_token) return null;

  const url = `${BACKEND_URL}/auth/v1/token?grant_type=refresh_token`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });

  if (!res.ok) {
    await clearSession();
    return null;
  }

  const data = await res.json();
  await saveSession(data);
  return data;
}

async function getValidSession() {
  const stored = await getStoredSession();
  return refreshSessionIfNeeded(stored);
}

async function apiFetch(path, { method = 'GET', headers = {}, body } = {}) {
  const session = await getValidSession();
  if (!session?.access_token) {
    const err = new Error('Not signed in');
    err.code = 'NOT_SIGNED_IN';
    throw err;
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: {
      apikey: PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.access_token}`,
      ...headers,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(text || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  // Some endpoints return empty body
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

function mapDrugFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    genericName: row.generic_name || '',
    manufacturer: row.manufacturer || '',
    batchNumber: row.batch_number,
    expiryDate: row.expiry_date,
    quantity: row.quantity || 0,
    category: row.category || '',
    notes: row.notes || '',
    unitPrice: row.unit_price || 0,
    aliases: (row.drug_aliases || []).map((a) => a.alias).filter(Boolean),
    brandNames: (row.drug_brand_names || [])
      .map((b) => ({ name: b.brand_name, manufacturer: b.brand_manufacturer || '' }))
      .filter((b) => b.name),
  };
}

function mapDrugToDbPayload(drug) {
  return {
    name: drug.name,
    generic_name: drug.genericName || '',
    manufacturer: drug.manufacturer || '',
    batch_number: drug.batchNumber,
    expiry_date: drug.expiryDate,
    quantity: drug.quantity ?? 0,
    category: drug.category || null,
    notes: drug.notes || null,
    unit_price: drug.unitPrice ?? null,
  };
}

async function cloudFetchDrugs() {
  const rows = await apiFetch(
    `/rest/v1/drugs?select=*,drug_aliases(alias),drug_brand_names(brand_name,brand_manufacturer)&order=expiry_date.asc`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  const drugs = (rows || []).map(mapDrugFromDb).map(decorateDrug);
  await chrome.storage.local.set({
    [STORAGE_KEYS.cache]: { fetchedAt: Date.now(), drugs },
  });
  return drugs;
}

async function cloudGetCachedDrugs({ maxAgeMs = 10 * 60 * 1000 } = {}) {
  const { [STORAGE_KEYS.cache]: cache } = await chrome.storage.local.get(STORAGE_KEYS.cache);
  if (cache?.drugs && cache?.fetchedAt && Date.now() - cache.fetchedAt < maxAgeMs) return cache.drugs;
  return null;
}

async function cloudGetDrugs() {
  return (await cloudGetCachedDrugs()) || cloudFetchDrugs();
}

async function cloudAddDrug(drug) {
  const inserted = await apiFetch('/rest/v1/drugs?select=*', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(mapDrugToDbPayload(drug)),
  });

  const drugRow = Array.isArray(inserted) ? inserted[0] : inserted;
  const drugId = drugRow?.id;

  const aliases = Array.isArray(drug.aliases) ? drug.aliases.filter(Boolean) : [];
  if (drugId && aliases.length) {
    await apiFetch('/rest/v1/drug_aliases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aliases.map((alias) => ({ drug_id: drugId, alias }))),
    });
  }

  const brands = Array.isArray(drug.brandNames) ? drug.brandNames.filter((b) => b?.name) : [];
  if (drugId && brands.length) {
    await apiFetch('/rest/v1/drug_brand_names', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        brands.map((b) => ({
          drug_id: drugId,
          brand_name: b.name,
          brand_manufacturer: b.manufacturer || null,
        }))
      ),
    });
  }

  // refresh cache
  await cloudFetchDrugs();
  return { success: true };
}

async function cloudUpdateDrug(id, drug) {
  // Update main record
  await apiFetch(`/rest/v1/drugs?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mapDrugToDbPayload(drug)),
  });

  // Replace aliases + brands
  await apiFetch(`/rest/v1/drug_aliases?drug_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
  await apiFetch(`/rest/v1/drug_brand_names?drug_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });

  const aliases = Array.isArray(drug.aliases) ? drug.aliases.filter(Boolean) : [];
  if (aliases.length) {
    await apiFetch('/rest/v1/drug_aliases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aliases.map((alias) => ({ drug_id: id, alias }))),
    });
  }

  const brands = Array.isArray(drug.brandNames) ? drug.brandNames.filter((b) => b?.name) : [];
  if (brands.length) {
    await apiFetch('/rest/v1/drug_brand_names', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        brands.map((b) => ({
          drug_id: id,
          brand_name: b.name,
          brand_manufacturer: b.manufacturer || null,
        }))
      ),
    });
  }

  await cloudFetchDrugs();
  return { success: true };
}

async function cloudDeleteDrug(id) {
  await apiFetch(`/rest/v1/drug_aliases?drug_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
  await apiFetch(`/rest/v1/drug_brand_names?drug_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
  await apiFetch(`/rest/v1/drugs?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
  await cloudFetchDrugs();
  return { success: true };
}

async function cloudImportDrugs(drugs) {
  // simplest safe approach: insert one-by-one so aliases/brands are attached correctly
  for (const d of drugs || []) {
    await cloudAddDrug(d);
  }
  await cloudFetchDrugs();
  return { success: true, count: (drugs || []).length };
}

// -----------------------------
// Local storage operations
// -----------------------------

async function localGetDrugs() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.localDrugs);
  const drugs = result[STORAGE_KEYS.localDrugs] || [];
  return drugs.map(decorateDrug);
}

async function localAddDrug(drug) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.localDrugs);
  const drugs = result[STORAGE_KEYS.localDrugs] || [];
  const newDrug = {
    ...drug,
    id: crypto.randomUUID(),
    aliases: drug.aliases || [],
    brandNames: drug.brandNames || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  drugs.push(newDrug);
  await chrome.storage.local.set({ [STORAGE_KEYS.localDrugs]: drugs });
  return newDrug;
}

async function localUpdateDrug(id, drugData) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.localDrugs);
  const drugs = result[STORAGE_KEYS.localDrugs] || [];
  const index = drugs.findIndex((d) => d.id === id);
  if (index !== -1) {
    drugs[index] = {
      ...drugs[index],
      ...drugData,
      aliases: drugData.aliases || drugs[index].aliases || [],
      brandNames: drugData.brandNames || drugs[index].brandNames || [],
      updatedAt: new Date().toISOString(),
    };
    await chrome.storage.local.set({ [STORAGE_KEYS.localDrugs]: drugs });
    return drugs[index];
  }
  return null;
}

async function localDeleteDrug(id) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.localDrugs);
  const drugs = result[STORAGE_KEYS.localDrugs] || [];
  const filtered = drugs.filter((d) => d.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEYS.localDrugs]: filtered });
  return { success: true };
}

async function localImportDrugs(newDrugs) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.localDrugs);
  const existingDrugs = result[STORAGE_KEYS.localDrugs] || [];

  const drugsToAdd = (newDrugs || []).map((drug) => ({
    ...drug,
    id: crypto.randomUUID(),
    aliases: drug.aliases || [],
    brandNames: drug.brandNames || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const allDrugs = [...existingDrugs, ...drugsToAdd];
  await chrome.storage.local.set({ [STORAGE_KEYS.localDrugs]: allDrugs });

  return { success: true, count: drugsToAdd.length };
}

// -----------------------------
// Facade (mode-aware)
// -----------------------------

async function getDrugs() {
  const mode = await getMode();
  if (mode === 'cloud') {
    try {
      return await cloudGetDrugs();
    } catch (e) {
      // fallback to local if signed out / token expired
      await setMode('local');
      return localGetDrugs();
    }
  }
  return localGetDrugs();
}

async function addDrug(drug) {
  const mode = await getMode();
  if (mode === 'cloud') return cloudAddDrug(drug);
  return localAddDrug(drug);
}

async function updateDrug(id, drug) {
  const mode = await getMode();
  if (mode === 'cloud') return cloudUpdateDrug(id, drug);
  return localUpdateDrug(id, drug);
}

async function deleteDrug(id) {
  const mode = await getMode();
  if (mode === 'cloud') return cloudDeleteDrug(id);
  return localDeleteDrug(id);
}

async function importDrugs(drugs) {
  const mode = await getMode();
  if (mode === 'cloud') return cloudImportDrugs(drugs);
  return localImportDrugs(drugs);
}

async function exportDrugs() {
  return getDrugs();
}

async function getStats() {
  const drugs = await getDrugs();
  const totalValue = drugs.reduce((sum, d) => sum + (d.quantity || 0) * (d.unitPrice || 0), 0);
  const expiringDrugs = drugs.filter((d) => d.status === 'expiring');
  const expiringValue = expiringDrugs.reduce((sum, d) => sum + (d.quantity || 0) * (d.unitPrice || 0), 0);

  return {
    total: drugs.length,
    expired: drugs.filter((d) => d.status === 'expired').length,
    expiring: expiringDrugs.length,
    safe: drugs.filter((d) => d.status === 'safe').length,
    totalValue: totalValue.toFixed(2),
    expiringValue: expiringValue.toFixed(2),
  };
}

async function handleDrugCheck(text) {
  const drugs = await getDrugs();
  const matches = findMatchingDrugs(text, drugs);
  return matches.map(decorateDrug);
}

// -----------------------------
// Messaging API
// -----------------------------

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    switch (request?.type) {
      case 'GET_MODE':
        return sendResponse({ mode: await getMode() });

      case 'SET_MODE':
        return sendResponse(await setMode(request.mode));

      case 'GET_AUTH_STATE': {
        const mode = await getMode();
        const session = await getValidSession();
        return sendResponse({
          mode,
          signedIn: !!session?.access_token,
          expiresAt: session?.expires_at || null,
        });
      }

      case 'SIGN_IN': {
        const email = (request.email || '').trim();
        const password = request.password || '';
        const url = `${BACKEND_URL}/auth/v1/token?grant_type=password`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            apikey: PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          return sendResponse({ ok: false, error: txt || 'Sign in failed' });
        }

        const data = await res.json();
        await saveSession(data);
        await setMode('cloud');
        // warm cache
        await cloudFetchDrugs().catch(() => null);
        return sendResponse({ ok: true });
      }

      case 'SIGN_OUT': {
        await clearSession();
        await setMode('local');
        return sendResponse({ ok: true });
      }

      case 'CHECK_DRUG':
        return sendResponse(await handleDrugCheck(request.text));

      case 'GET_DRUGS':
        return sendResponse(await getDrugs());

      case 'ADD_DRUG':
        return sendResponse(await addDrug(request.drug));

      case 'UPDATE_DRUG':
        return sendResponse(await updateDrug(request.id, request.drug));

      case 'DELETE_DRUG':
        return sendResponse(await deleteDrug(request.id));

      case 'GET_STATS':
        return sendResponse(await getStats());

      case 'IMPORT_DRUGS':
        return sendResponse(await importDrugs(request.drugs));

      case 'EXPORT_DRUGS':
        return sendResponse(await exportDrugs());

      default:
        return sendResponse({ ok: false, error: 'Unknown message type' });
    }
  })().catch((err) => {
    console.error('Drug Expiry Tracker background error:', err);
    sendResponse({ ok: false, error: err?.message || String(err) });
  });

  return true;
});
