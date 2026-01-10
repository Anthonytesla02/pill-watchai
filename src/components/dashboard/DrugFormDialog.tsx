import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Drug, DrugFormData } from '@/types/drug';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const drugSchema = z.object({
  name: z.string().min(1, 'Drug name is required'),
  generic_name: z.string().min(1, 'Generic name is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  batch_number: z.string().min(1, 'Batch number is required'),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  category: z.string().optional(),
  notes: z.string().optional(),
  unit_price: z.coerce.number().min(0).optional(),
});

interface DrugFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drug?: Drug | null;
  onSubmit: (data: DrugFormData) => void;
}

const defaultCategories = [
  'Antibiotics',
  'Pain Relief',
  'Diabetes',
  'Cardiovascular',
  'Respiratory',
  'Gastrointestinal',
  'Mental Health',
  'Vitamins & Supplements',
  'Other',
];

export function DrugFormDialog({ open, onOpenChange, drug, onSubmit }: DrugFormDialogProps) {
  const [aliases, setAliases] = useState<string[]>([]);
  const [newAlias, setNewAlias] = useState('');
  const [brandNames, setBrandNames] = useState<{ name: string; manufacturer?: string }[]>([]);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandManufacturer, setNewBrandManufacturer] = useState('');

  const form = useForm<z.infer<typeof drugSchema>>({
    resolver: zodResolver(drugSchema),
    defaultValues: {
      name: '',
      generic_name: '',
      manufacturer: '',
      batch_number: '',
      expiry_date: '',
      quantity: 0,
      category: '',
      notes: '',
      unit_price: 0,
    },
  });

  useEffect(() => {
    if (drug) {
      form.reset({
        name: drug.name,
        generic_name: drug.generic_name,
        manufacturer: drug.manufacturer,
        batch_number: drug.batch_number,
        expiry_date: drug.expiry_date,
        quantity: drug.quantity,
        category: drug.category || '',
        notes: drug.notes || '',
        unit_price: drug.unit_price || 0,
      });
      setAliases(drug.aliases?.map(a => a.alias) || []);
      setBrandNames(drug.brand_names?.map(b => ({ name: b.brand_name, manufacturer: b.brand_manufacturer })) || []);
    } else {
      form.reset({
        name: '',
        generic_name: '',
        manufacturer: '',
        batch_number: '',
        expiry_date: '',
        quantity: 0,
        category: '',
        notes: '',
        unit_price: 0,
      });
      setAliases([]);
      setBrandNames([]);
    }
  }, [drug, form]);

  const handleSubmit = (data: z.infer<typeof drugSchema>) => {
    const formData: DrugFormData = {
      name: data.name,
      generic_name: data.generic_name,
      manufacturer: data.manufacturer,
      batch_number: data.batch_number,
      expiry_date: data.expiry_date,
      quantity: data.quantity,
      category: data.category,
      notes: data.notes,
      unit_price: data.unit_price,
      aliases,
      brand_names: brandNames,
    };
    onSubmit(formData);
    onOpenChange(false);
    form.reset();
    setAliases([]);
    setBrandNames([]);
  };

  const addAlias = () => {
    if (newAlias.trim() && !aliases.includes(newAlias.trim())) {
      setAliases([...aliases, newAlias.trim()]);
      setNewAlias('');
    }
  };

  const removeAlias = (alias: string) => {
    setAliases(aliases.filter(a => a !== alias));
  };

  const addBrandName = () => {
    if (newBrandName.trim()) {
      setBrandNames([...brandNames, { name: newBrandName.trim(), manufacturer: newBrandManufacturer.trim() || undefined }]);
      setNewBrandName('');
      setNewBrandManufacturer('');
    }
  };

  const removeBrandName = (index: number) => {
    setBrandNames(brandNames.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {drug ? 'Edit Drug' : 'Add New Drug'}
          </DialogTitle>
          <DialogDescription>
            {drug ? 'Update the drug information below.' : 'Fill in the details to add a new drug to the tracker.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drug Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Amoxicillin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="generic_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Generic Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Amoxicillin Trihydrate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Pfizer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="batch_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AMX-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {defaultCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Aliases Section */}
            <div className="space-y-2">
              <FormLabel>Alternative Names / Aliases</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add an alias (e.g., common name)"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAlias())}
                />
                <Button type="button" variant="outline" size="icon" onClick={addAlias}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {aliases.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {aliases.map((alias) => (
                    <Badge key={alias} variant="secondary" className="gap-1">
                      {alias}
                      <button
                        type="button"
                        onClick={() => removeAlias(alias)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Brand Names Section */}
            <div className="space-y-2">
              <FormLabel>Brand Names</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Brand name"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Manufacturer (optional)"
                  value={newBrandManufacturer}
                  onChange={(e) => setNewBrandManufacturer(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={addBrandName}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {brandNames.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {brandNames.map((brand, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {brand.name}
                      {brand.manufacturer && <span className="text-muted-foreground">({brand.manufacturer})</span>}
                      <button
                        type="button"
                        onClick={() => removeBrandName(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {drug ? 'Save Changes' : 'Add Drug'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
