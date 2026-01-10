import { useState } from 'react';
import { Package, AlertTriangle, XCircle, CheckCircle, DollarSign, Download, Upload, LogOut, User } from 'lucide-react';
import { useDrugsDB } from '@/hooks/useDrugsDB';
import { useAuth } from '@/contexts/AuthContext';
import { Drug, DrugFormData } from '@/types/drug';
import { StatCard } from '@/components/dashboard/StatCard';
import { DrugTable } from '@/components/dashboard/DrugTable';
import { DrugFormDialog } from '@/components/dashboard/DrugFormDialog';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { ExtensionDemo } from '@/components/dashboard/ExtensionDemo';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Pill, Plus, Chrome } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Index = () => {
  const { drugs, isLoading, addDrug, updateDrug, deleteDrug, getDrugStatus, getStats, exportDrugs } = useDrugsDB();
  const { user, profile, signOut } = useAuth();
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

  const handleConfirmDelete = async () => {
    if (drugToDelete) {
      await deleteDrug(drugToDelete.id);
      toast({
        title: 'Drug Deleted',
        description: `${drugToDelete.name} has been removed from the tracker.`,
      });
      setDrugToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleFormSubmit = async (data: DrugFormData) => {
    if (editingDrug) {
      await updateDrug(editingDrug.id, data);
      toast({
        title: 'Drug Updated',
        description: `${data.name} has been updated successfully.`,
      });
    } else {
      await addDrug(data);
      toast({
        title: 'Drug Added',
        description: `${data.name} has been added to the tracker.`,
      });
    }
  };

  const handleExport = () => {
    exportDrugs();
    toast({
      title: 'Export Complete',
      description: 'Your drug inventory has been exported to CSV.',
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed Out',
      description: 'You have been signed out successfully.',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                <Pill className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-display tracking-tight">Drug Expiry Tracker</h1>
                <p className="text-sm text-muted-foreground">Professional pharmacy inventory</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExtensionDemoOpen(true)} className="gap-2">
                <Chrome className="h-4 w-4" />
                Extension
              </Button>
              <Button onClick={handleAddDrug} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Drug
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {profile?.display_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.display_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      {profile?.pharmacy_name && (
                        <p className="text-xs text-muted-foreground">{profile.pharmacy_name}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      
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
