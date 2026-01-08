import { Pill, Plus, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onAddDrug: () => void;
  onShowExtension: () => void;
}

export function Header({ onAddDrug, onShowExtension }: HeaderProps) {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight">Drug Expiry Tracker</h1>
              <p className="text-sm text-muted-foreground">Manage medication inventory & expiry dates</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onShowExtension} className="gap-2">
              <Chrome className="h-4 w-4" />
              Extension Demo
            </Button>
            <Button onClick={onAddDrug} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Drug
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
