export interface Drug {
  id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  category: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DrugStatus = 'expired' | 'expiring' | 'safe';

export interface DrugFormData {
  name: string;
  genericName: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  category: string;
  notes?: string;
}
