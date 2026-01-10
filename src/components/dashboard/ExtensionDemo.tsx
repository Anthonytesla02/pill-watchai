import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X, Pill, Chrome } from 'lucide-react';
import { Drug } from '@/types/drug';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface ExtensionDemoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drugs: Drug[];
  getDrugStatus: (date: string) => 'expired' | 'expiring' | 'safe';
}

interface Toast {
  id: string;
  drug: Drug;
  status: 'expired' | 'expiring' | 'safe';
}

export function ExtensionDemo({ open, onOpenChange, drugs, getDrugStatus }: ExtensionDemoProps) {
  const [inputValue, setInputValue] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const checkForDrugMatch = useCallback((value: string) => {
    const searchTerm = value.toLowerCase().trim();
    if (searchTerm.length < 3) return;

    const matchedDrug = drugs.find(
      drug =>
        drug.name.toLowerCase().includes(searchTerm) ||
        drug.generic_name.toLowerCase().includes(searchTerm)
    );

    if (matchedDrug) {
      const status = getDrugStatus(matchedDrug.expiry_date);
      const existingToast = toasts.find(t => t.drug.id === matchedDrug.id);
      
      if (!existingToast && (status === 'expired' || status === 'expiring')) {
        const newToast: Toast = {
          id: crypto.randomUUID(),
          drug: matchedDrug,
          status,
        };
        setToasts(prev => [...prev, newToast]);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 5000);
      }
    }
  }, [drugs, getDrugStatus, toasts]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkForDrugMatch(inputValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, checkForDrugMatch]);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const statusColors = {
    expired: 'bg-expired/10 border-expired text-expired',
    expiring: 'bg-expiring/10 border-expiring text-expiring',
    safe: 'bg-safe/10 border-safe text-safe',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Chrome className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl">Chrome Extension Demo</DialogTitle>
              <DialogDescription>
                Try typing a drug name to see the expiry notification
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Simulated Website */}
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/50" />
                <div className="w-3 h-3 rounded-full bg-expiring/50" />
                <div className="w-3 h-3 rounded-full bg-safe/50" />
              </div>
              <div className="flex-1 bg-background rounded-md px-3 py-1 text-xs text-muted-foreground">
                https://pharmacy-order.example.com
              </div>
            </div>
            <div className="p-6 bg-background min-h-[200px] relative">
              <h3 className="font-semibold mb-4">Order Medication</h3>
              <div className="max-w-md space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Enter drug name:
                  </label>
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Start typing... (try 'amox' or 'metformin')"
                    className="text-lg"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  The extension monitors input fields and alerts you when you type a drug that's expired or expiring soon.
                </p>
              </div>

              {/* Toast Notifications */}
              <div className="fixed bottom-4 right-4 space-y-3 z-50">
                {toasts.map((toast) => (
                  <div
                    key={toast.id}
                    className={`toast-notification border-l-4 ${statusColors[toast.status]} animate-slide-up`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-foreground flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            {toast.drug.name}
                          </p>
                          <button
                            onClick={() => dismissToast(toast.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm mt-1">
                          {toast.status === 'expired' ? (
                            <span className="text-expired font-medium">
                              ⚠️ This drug has EXPIRED
                            </span>
                          ) : (
                            <span className="text-expiring font-medium">
                              ⚠️ Expiring on {format(new Date(toast.drug.expiry_date), 'MMM dd, yyyy')}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Batch: {toast.drug.batch_number} • {toast.drug.manufacturer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Drug Hints */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Try typing these drugs:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {drugs.slice(0, 5).map(drug => {
                const status = getDrugStatus(drug.expiry_date);
                return (
                  <button
                    key={drug.id}
                    onClick={() => setInputValue(drug.name.toLowerCase())}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                      status === 'expired' ? 'bg-expired/10 text-expired hover:bg-expired/20' :
                      status === 'expiring' ? 'bg-expiring/10 text-expiring hover:bg-expiring/20' :
                      'bg-safe/10 text-safe hover:bg-safe/20'
                    }`}
                  >
                    {drug.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
