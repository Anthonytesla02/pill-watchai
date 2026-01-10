import { useState } from 'react';
import { Package, AlertTriangle, XCircle, CheckCircle, DollarSign, Download, Upload, LogOut, BarChart3 } from 'lucide-react';
import { useDrugsDB } from '@/hooks/useDrugsDB';
import { useAuth } from '@/contexts/AuthContext';
import { Drug, DrugFormData } from '@/types/drug';
import { StatCard } from '@/components/dashboard/StatCard';
import { DrugTable } from '@/components/dashboard/DrugTable';
import { DrugFormDialog } from '@/components/dashboard/DrugFormDialog';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { ExtensionDemo } from '@/components/dashboard/ExtensionDemo';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { ImportDialog } from '@/components/dashboard/ImportDialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Pill, Plus, Chrome } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const { drugs, isLoading, addDrug, updateDrug, deleteDrug, getDrugStatus, getStats, exportDrugs, importDrugs } = useDrugsDB();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [drugToDelete, setDrugToDelete] = useState<Drug | null>(null);
  const [extensionDemoOpen, setExtensionDemoOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

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

  const handleImport = async (drugs: DrugFormData[]) => {
    const result = await importDrugs(drugs);
    toast({
      title: 'Import Complete',
      description: `Successfully imported ${result.success} drugs${result.failed > 0 ? `, ${result.failed} failed` : ''}.`,
    });
    return result;
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center animate-pulse">
            <Pill className="h-6 w-6 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading your inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                <Pill className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-display tracking-tight">Drug Expiry Tracker</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {profile?.pharmacy_name || 'Professional pharmacy inventory'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)} className="gap-2 hidden sm:flex">
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 hidden sm:flex">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExtensionDemoOpen(true)} className="gap-2 hidden md:flex">
                <Chrome className="h-4 w-4" />
                Extension
              </Button>
              <Button onClick={handleAddDrug} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Drug</span>
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
                      {profile?.role && (
                        <p className="text-xs text-primary">{profile.role}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setImportDialogOpen(true)} className="sm:hidden">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Drugs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport} className="sm:hidden">
                    <Download className="mr-2 h-4 w-4" />
                    Export Drugs
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="sm:hidden" />
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
      
      <main className="container mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
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
            description="Requires action"
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
          <StatCard
            title="Inventory Value"
            value={`$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            icon={DollarSign}
            variant="value"
            description={stats.expiringValue > 0 ? `$${stats.expiringValue.toFixed(0)} at risk` : 'All secure'}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="bg-card/80 border border-border/50">
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            <DrugTable
              drugs={drugs}
              getDrugStatus={getDrugStatus}
              onEdit={handleEditDrug}
              onDelete={handleDeleteClick}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsCharts drugs={drugs} getDrugStatus={getDrugStatus} />
          </TabsContent>
        </Tabs>
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

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImport}
      />
    </div>
  );
};

export default Index;
