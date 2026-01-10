import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { DrugFormData } from '@/types/drug';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (drugs: DrugFormData[]) => Promise<{ success: number; failed: number }>;
}

interface ParsedDrug {
  data: DrugFormData;
  valid: boolean;
  errors: string[];
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedDrugs, setParsedDrugs] = useState<ParsedDrug[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const parseCSV = (text: string): ParsedDrug[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
    const headerMap: Record<string, string> = {
      'name': 'name',
      'drug name': 'name',
      'generic name': 'generic_name',
      'generic': 'generic_name',
      'manufacturer': 'manufacturer',
      'batch number': 'batch_number',
      'batch': 'batch_number',
      'batch #': 'batch_number',
      'expiry date': 'expiry_date',
      'expiry': 'expiry_date',
      'exp date': 'expiry_date',
      'quantity': 'quantity',
      'qty': 'quantity',
      'category': 'category',
      'unit price': 'unit_price',
      'price': 'unit_price',
      'notes': 'notes',
      'aliases': 'aliases',
      'brand names': 'brand_names',
    };

    const columnIndices: Record<string, number> = {};
    headers.forEach((header, index) => {
      const mappedField = headerMap[header];
      if (mappedField) {
        columnIndices[mappedField] = index;
      }
    });

    return lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const errors: string[] = [];

      const getValue = (field: string): string => {
        const index = columnIndices[field];
        return index !== undefined ? (values[index] || '').trim().replace(/^"|"$/g, '') : '';
      };

      const name = getValue('name');
      const generic_name = getValue('generic_name');
      const manufacturer = getValue('manufacturer');
      const batch_number = getValue('batch_number');
      const expiry_date = getValue('expiry_date');
      const quantity = parseInt(getValue('quantity') || '0', 10);
      const category = getValue('category');
      const unit_price = parseFloat(getValue('unit_price') || '0');
      const notes = getValue('notes');
      const aliasesStr = getValue('aliases');
      const brandNamesStr = getValue('brand_names');

      // Validate required fields
      if (!name) errors.push('Name is required');
      if (!generic_name) errors.push('Generic name is required');
      if (!manufacturer) errors.push('Manufacturer is required');
      if (!batch_number) errors.push('Batch number is required');
      if (!expiry_date) errors.push('Expiry date is required');
      if (quantity < 1) errors.push('Quantity must be at least 1');

      // Parse date
      let parsedDate = expiry_date;
      if (expiry_date && !expiry_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Try to parse common date formats
        const datePatterns = [
          /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
          /(\d{1,2})-(\d{1,2})-(\d{4})/,   // MM-DD-YYYY
        ];
        for (const pattern of datePatterns) {
          const match = expiry_date.match(pattern);
          if (match) {
            const [, a, b, year] = match;
            // Assume MM/DD/YYYY format
            parsedDate = `${year}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
            break;
          }
        }
      }

      // Parse aliases
      const aliases = aliasesStr ? aliasesStr.split(';').map(a => a.trim()).filter(Boolean) : [];

      // Parse brand names
      const brand_names = brandNamesStr
        ? brandNamesStr.split(';').map(b => {
            const match = b.trim().match(/^(.+?)(?:\s*\((.+?)\))?$/);
            if (match) {
              return { name: match[1].trim(), manufacturer: match[2]?.trim() };
            }
            return { name: b.trim() };
          }).filter(b => b.name)
        : [];

      return {
        data: {
          name,
          generic_name,
          manufacturer,
          batch_number,
          expiry_date: parsedDate,
          quantity,
          category: category || undefined,
          unit_price: unit_price || undefined,
          notes: notes || undefined,
          aliases: aliases.length > 0 ? aliases : undefined,
          brand_names: brand_names.length > 0 ? brand_names : undefined,
        },
        valid: errors.length === 0,
        errors,
      };
    });
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setParsedDrugs(parsed);
    };
    reader.readAsText(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === 'text/csv') {
      handleFile(f);
    }
  }, [handleFile]);

  const handleImport = async () => {
    const validDrugs = parsedDrugs.filter(d => d.valid).map(d => d.data);
    if (validDrugs.length === 0) return;

    setImporting(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 10, 90));
    }, 100);

    const result = await onImport(validDrugs);
    
    clearInterval(interval);
    setProgress(100);
    setResult(result);
    setImporting(false);
  };

  const reset = () => {
    setFile(null);
    setParsedDrugs([]);
    setResult(null);
    setProgress(0);
  };

  const validCount = parsedDrugs.filter(d => d.valid).length;
  const invalidCount = parsedDrugs.filter(d => !d.valid).length;

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) reset(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Import Drugs</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import drugs in bulk
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop a CSV file here, or
              </p>
              <label>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <Button variant="outline" asChild>
                  <span className="cursor-pointer">Browse Files</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-4">
                Required columns: Name, Generic Name, Manufacturer, Batch Number, Expiry Date, Quantity
              </p>
            </div>
          ) : result ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-safe mb-4" />
              <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
              <p className="text-muted-foreground">
                Successfully imported {result.success} drugs
                {result.failed > 0 && `, ${result.failed} failed`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {parsedDrugs.length} rows found
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Change
                </Button>
              </div>

              {parsedDrugs.length > 0 && (
                <div className="flex gap-4">
                  <div className="flex-1 p-3 bg-safe/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-safe" />
                      <span className="font-medium">{validCount} Valid</span>
                    </div>
                  </div>
                  {invalidCount > 0 && (
                    <div className="flex-1 p-3 bg-expired/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-expired" />
                        <span className="font-medium">{invalidCount} Invalid</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {invalidCount > 0 && (
                <div className="max-h-[150px] overflow-y-auto space-y-2">
                  {parsedDrugs.filter(d => !d.valid).slice(0, 5).map((drug, i) => (
                    <div key={i} className="p-2 bg-expired/5 rounded border border-expired/20 text-sm">
                      <p className="font-medium">{drug.data.name || 'Unknown'}</p>
                      <p className="text-expired text-xs">{drug.errors.join(', ')}</p>
                    </div>
                  ))}
                </div>
              )}

              {importing && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">
                    Importing drugs...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && file && (
            <Button onClick={handleImport} disabled={validCount === 0 || importing}>
              Import {validCount} Drugs
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
