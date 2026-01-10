import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Drug, DrugFormData, DrugStats, Category } from '@/types/drug';
import { useAuth } from '@/contexts/AuthContext';

export function useDrugsDB() {
  const { user } = useAuth();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDrugs = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('drugs')
      .select(`
        *,
        drug_aliases(*),
        drug_brand_names(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDrugs(data.map(drug => ({
        ...drug,
        aliases: drug.drug_aliases || [],
        brand_names: drug.drug_brand_names || [],
      })) as Drug[]);
    }
    setIsLoading(false);
  }, [user]);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (data) {
      setCategories(data as Category[]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDrugs();
      fetchCategories();
    } else {
      setDrugs([]);
      setCategories([]);
      setIsLoading(false);
    }
  }, [user, fetchDrugs, fetchCategories]);

  const addDrug = useCallback(async (data: DrugFormData) => {
    if (!user) return null;

    const { data: newDrug, error } = await supabase
      .from('drugs')
      .insert({
        user_id: user.id,
        name: data.name,
        generic_name: data.generic_name,
        manufacturer: data.manufacturer,
        batch_number: data.batch_number,
        expiry_date: data.expiry_date,
        quantity: data.quantity,
        category: data.category,
        notes: data.notes,
        unit_price: data.unit_price || 0,
      })
      .select()
      .single();

    if (error || !newDrug) return null;

    // Add aliases
    if (data.aliases && data.aliases.length > 0) {
      await supabase.from('drug_aliases').insert(
        data.aliases.map(alias => ({
          drug_id: newDrug.id,
          alias,
        }))
      );
    }

    // Add brand names
    if (data.brand_names && data.brand_names.length > 0) {
      await supabase.from('drug_brand_names').insert(
        data.brand_names.map(brand => ({
          drug_id: newDrug.id,
          brand_name: brand.name,
          brand_manufacturer: brand.manufacturer,
        }))
      );
    }

    await fetchDrugs();
    return newDrug;
  }, [user, fetchDrugs]);

  const updateDrug = useCallback(async (id: string, data: DrugFormData) => {
    if (!user) return;

    await supabase
      .from('drugs')
      .update({
        name: data.name,
        generic_name: data.generic_name,
        manufacturer: data.manufacturer,
        batch_number: data.batch_number,
        expiry_date: data.expiry_date,
        quantity: data.quantity,
        category: data.category,
        notes: data.notes,
        unit_price: data.unit_price || 0,
      })
      .eq('id', id);

    // Update aliases - delete existing and insert new
    await supabase.from('drug_aliases').delete().eq('drug_id', id);
    if (data.aliases && data.aliases.length > 0) {
      await supabase.from('drug_aliases').insert(
        data.aliases.map(alias => ({
          drug_id: id,
          alias,
        }))
      );
    }

    // Update brand names - delete existing and insert new
    await supabase.from('drug_brand_names').delete().eq('drug_id', id);
    if (data.brand_names && data.brand_names.length > 0) {
      await supabase.from('drug_brand_names').insert(
        data.brand_names.map(brand => ({
          drug_id: id,
          brand_name: brand.name,
          brand_manufacturer: brand.manufacturer,
        }))
      );
    }

    await fetchDrugs();
  }, [user, fetchDrugs]);

  const deleteDrug = useCallback(async (id: string) => {
    await supabase.from('drugs').delete().eq('id', id);
    setDrugs(prev => prev.filter(d => d.id !== id));
  }, []);

  const addCategory = useCallback(async (name: string, color: string = '#6366f1') => {
    if (!user) return;

    await supabase.from('categories').insert({
      user_id: user.id,
      name,
      color,
    });
    await fetchCategories();
  }, [user, fetchCategories]);

  const getDrugStatus = useCallback((expiryDate: string): 'expired' | 'expiring' | 'safe' => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 90) return 'expiring';
    return 'safe';
  }, []);

  const getStats = useCallback((): DrugStats => {
    const expired = drugs.filter(d => getDrugStatus(d.expiry_date) === 'expired');
    const expiring = drugs.filter(d => getDrugStatus(d.expiry_date) === 'expiring');
    const safe = drugs.filter(d => getDrugStatus(d.expiry_date) === 'safe');
    
    const totalValue = drugs.reduce((sum, d) => sum + (d.unit_price || 0) * d.quantity, 0);
    const expiringValue = [...expired, ...expiring].reduce((sum, d) => sum + (d.unit_price || 0) * d.quantity, 0);

    return {
      total: drugs.length,
      expired: expired.length,
      expiring: expiring.length,
      safe: safe.length,
      totalValue,
      expiringValue,
    };
  }, [drugs, getDrugStatus]);

  const importDrugs = useCallback(async (drugsData: DrugFormData[]) => {
    if (!user) return { success: 0, failed: 0 };

    let success = 0;
    let failed = 0;

    for (const drug of drugsData) {
      const result = await addDrug(drug);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }, [user, addDrug]);

  const exportDrugs = useCallback(() => {
    const headers = ['Name', 'Generic Name', 'Manufacturer', 'Batch Number', 'Expiry Date', 'Quantity', 'Category', 'Unit Price', 'Notes', 'Aliases', 'Brand Names'];
    
    const rows = drugs.map(drug => [
      drug.name,
      drug.generic_name,
      drug.manufacturer,
      drug.batch_number,
      drug.expiry_date,
      drug.quantity.toString(),
      drug.category || '',
      (drug.unit_price || 0).toString(),
      drug.notes || '',
      drug.aliases?.map(a => a.alias).join('; ') || '',
      drug.brand_names?.map(b => `${b.brand_name}${b.brand_manufacturer ? ` (${b.brand_manufacturer})` : ''}`).join('; ') || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `drug-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [drugs]);

  return {
    drugs,
    categories,
    isLoading,
    addDrug,
    updateDrug,
    deleteDrug,
    addCategory,
    getDrugStatus,
    getStats,
    importDrugs,
    exportDrugs,
    refetch: fetchDrugs,
  };
}
