import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Drug, DrugFormData } from '@/types/drug';
import { Button } from '@/components/ui/button';
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

const drugSchema = z.object({
  name: z.string().min(1, 'Drug name is required'),
  genericName: z.string().min(1, 'Generic name is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  category: z.string().min(1, 'Category is required'),
  notes: z.string().optional(),
});

interface DrugFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drug?: Drug | null;
  onSubmit: (data: DrugFormData) => void;
}

const categories = [
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
  const form = useForm<DrugFormData>({
    resolver: zodResolver(drugSchema),
    defaultValues: {
      name: '',
      genericName: '',
      manufacturer: '',
      batchNumber: '',
      expiryDate: '',
      quantity: 0,
      category: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (drug) {
      form.reset({
        name: drug.name,
        genericName: drug.genericName,
        manufacturer: drug.manufacturer,
        batchNumber: drug.batchNumber,
        expiryDate: drug.expiryDate,
        quantity: drug.quantity,
        category: drug.category,
        notes: drug.notes || '',
      });
    } else {
      form.reset({
        name: '',
        genericName: '',
        manufacturer: '',
        batchNumber: '',
        expiryDate: '',
        quantity: 0,
        category: '',
        notes: '',
      });
    }
  }, [drug, form]);

  const handleSubmit = (data: DrugFormData) => {
    onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
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
                name="genericName"
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
                name="batchNumber"
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
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="expiryDate"
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
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
