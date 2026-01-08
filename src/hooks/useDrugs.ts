import { useState, useEffect, useCallback } from 'react';
import { Drug, DrugFormData } from '@/types/drug';

const STORAGE_KEY = 'drug-expiry-tracker';

const defaultDrugs: Drug[] = [
  {
    id: '1',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin Trihydrate',
    manufacturer: 'Pfizer',
    batchNumber: 'AMX-2024-001',
    expiryDate: '2024-02-15',
    quantity: 500,
    category: 'Antibiotics',
    notes: 'Store in cool, dry place',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    manufacturer: 'GSK',
    batchNumber: 'PCT-2024-042',
    expiryDate: '2025-06-30',
    quantity: 1000,
    category: 'Pain Relief',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    manufacturer: 'Advil',
    batchNumber: 'IBU-2024-103',
    expiryDate: '2026-03-20',
    quantity: 750,
    category: 'Pain Relief',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
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
    notes: 'Monitor blood sugar levels',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    manufacturer: 'AstraZeneca',
    batchNumber: 'LIS-2024-078',
    expiryDate: '2025-08-25',
    quantity: 200,
    category: 'Cardiovascular',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

export function useDrugs() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setDrugs(JSON.parse(stored));
    } else {
      setDrugs(defaultDrugs);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDrugs));
    }
    setIsLoading(false);
  }, []);

  const saveDrugs = useCallback((newDrugs: Drug[]) => {
    setDrugs(newDrugs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDrugs));
  }, []);

  const addDrug = useCallback((data: DrugFormData) => {
    const newDrug: Drug = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveDrugs([...drugs, newDrug]);
    return newDrug;
  }, [drugs, saveDrugs]);

  const updateDrug = useCallback((id: string, data: DrugFormData) => {
    const updated = drugs.map(drug =>
      drug.id === id
        ? { ...drug, ...data, updatedAt: new Date().toISOString() }
        : drug
    );
    saveDrugs(updated);
  }, [drugs, saveDrugs]);

  const deleteDrug = useCallback((id: string) => {
    saveDrugs(drugs.filter(drug => drug.id !== id));
  }, [drugs, saveDrugs]);

  const getDrugStatus = useCallback((expiryDate: string): 'expired' | 'expiring' | 'safe' => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 90) return 'expiring';
    return 'safe';
  }, []);

  const getStats = useCallback(() => {
    const expired = drugs.filter(d => getDrugStatus(d.expiryDate) === 'expired').length;
    const expiring = drugs.filter(d => getDrugStatus(d.expiryDate) === 'expiring').length;
    const safe = drugs.filter(d => getDrugStatus(d.expiryDate) === 'safe').length;
    return { total: drugs.length, expired, expiring, safe };
  }, [drugs, getDrugStatus]);

  return {
    drugs,
    isLoading,
    addDrug,
    updateDrug,
    deleteDrug,
    getDrugStatus,
    getStats,
  };
}
