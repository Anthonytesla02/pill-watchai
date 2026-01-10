export interface DrugAlias {
  id: string;
  drug_id: string;
  alias: string;
  created_at: string;
}

export interface DrugBrandName {
  id: string;
  drug_id: string;
  brand_name: string;
  brand_manufacturer?: string;
  created_at: string;
}

export interface Drug {
  id: string;
  user_id: string;
  name: string;
  generic_name: string;
  manufacturer: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  category_id?: string;
  category?: string;
  notes?: string;
  unit_price?: number;
  created_at: string;
  updated_at: string;
  aliases?: DrugAlias[];
  brand_names?: DrugBrandName[];
}

export type DrugStatus = 'expired' | 'expiring' | 'safe';

export interface DrugFormData {
  name: string;
  generic_name: string;
  manufacturer: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  category?: string;
  notes?: string;
  unit_price?: number;
  aliases?: string[];
  brand_names?: { name: string; manufacturer?: string }[];
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  role?: string;
  pharmacy_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DrugStats {
  total: number;
  expired: number;
  expiring: number;
  safe: number;
  totalValue: number;
  expiringValue: number;
}
