import { useState } from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, Search, Filter } from 'lucide-react';
import { Drug, DrugStatus } from '@/types/drug';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';

interface DrugTableProps {
  drugs: Drug[];
  getDrugStatus: (date: string) => DrugStatus;
  onEdit: (drug: Drug) => void;
  onDelete: (id: string) => void;
}

export function DrugTable({ drugs, getDrugStatus, onEdit, onDelete }: DrugTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = [...new Set(drugs.map(d => d.category))];

  const filteredDrugs = drugs.filter(drug => {
    const matchesSearch =
      drug.name.toLowerCase().includes(search.toLowerCase()) ||
      drug.genericName.toLowerCase().includes(search.toLowerCase()) ||
      drug.manufacturer.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || getDrugStatus(drug.expiryDate) === statusFilter;

    const matchesCategory =
      categoryFilter === 'all' || drug.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drugs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="safe">Safe</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold">Drug Name</TableHead>
              <TableHead className="font-semibold">Generic Name</TableHead>
              <TableHead className="font-semibold">Manufacturer</TableHead>
              <TableHead className="font-semibold">Batch #</TableHead>
              <TableHead className="font-semibold">Expiry Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Qty</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDrugs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No drugs found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredDrugs.map((drug) => {
                const status = getDrugStatus(drug.expiryDate);
                return (
                  <TableRow key={drug.id} className="drug-row">
                    <TableCell className="font-medium">{drug.name}</TableCell>
                    <TableCell className="text-muted-foreground">{drug.genericName}</TableCell>
                    <TableCell>{drug.manufacturer}</TableCell>
                    <TableCell className="font-mono text-sm">{drug.batchNumber}</TableCell>
                    <TableCell>{format(new Date(drug.expiryDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    <TableCell>{drug.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(drug)}
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(drug.id)}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
