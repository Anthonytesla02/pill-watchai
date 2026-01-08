import { useState } from 'react';
import { Package, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useDrugs } from '@/hooks/useDrugs';
import { Drug, DrugFormData } from '@/types/drug';
import { Header } from '@/components/dashboard/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { DrugTable } from '@/components/dashboard/DrugTable';
import { DrugFormDialog } from '@/components/dashboard/DrugFormDialog';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { ExtensionDemo } from '@/components/dashboard/ExtensionDemo';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { drugs, isLoading, addDrug, updateDrug, deleteDrug, getDrugStatus, getStats } = useDrugs();
  const { toast } = useToast();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [drugToDelete, setDrugToDelete] = useState<Drug | null>(null);
  const [extensionDemoOpen, setExtensionDemoOpen] = useState(false);

  const stats = getStats();

  const handleAddDrug = () => {
    setEditingDrug(null);
    setFormOpen(true);
  };

  const handleEditDrug = (drug: Drug) => {
    setEditingDrug(drug);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    const drug = drugs.find(d => d.id === id);
    if (drug) {
      setDrugToDelete(drug);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (drugToDelete) {
      deleteDrug(drugToDelete.id);
      toast({
        title: 'Drug Deleted',
        description: `${drugToDelete.name} has been removed from the tracker.`,
      });
      setDrugToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleFormSubmit = (data: DrugFormData) => {
    if (editingDrug) {
      updateDrug(editingDrug.id, data);
      toast({
        title: 'Drug Updated',
        description: `${data.name} has been updated successfully.`,
      });
    } else {
      addDrug(data);
      toast({
        title: 'Drug Added',
        description: `${data.name} has been added to the tracker.`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onAddDrug={handleAddDrug} onShowExtension={() => setExtensionDemoOpen(true)} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Drugs"
            value={stats.total}
            icon={Package}
            variant="default"
            description="In inventory"
          />
          <StatCard
            title="Expired"
            value={stats.expired}
            icon={XCircle}
            variant="expired"
            description="Requires immediate action"
          />
          <StatCard
            title="Expiring Soon"
            value={stats.expiring}
            icon={AlertTriangle}
            variant="expiring"
            description="Within 90 days"
          />
          <StatCard
            title="Safe"
            value={stats.safe}
            icon={CheckCircle}
            variant="safe"
            description="More than 90 days"
          />
        </div>

        {/* Drug Table */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold font-display mb-4">Drug Inventory</h2>
          <DrugTable
            drugs={drugs}
            getDrugStatus={getDrugStatus}
            onEdit={handleEditDrug}
            onDelete={handleDeleteClick}
          />
        </div>
      </main>

      {/* Dialogs */}
      <DrugFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        drug={editingDrug}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        drugName={drugToDelete?.name || ''}
      />

      <ExtensionDemo
        open={extensionDemoOpen}
        onOpenChange={setExtensionDemoOpen}
        drugs={drugs}
        getDrugStatus={getDrugStatus}
      />
    </div>
  );
};

export default Index;
