import { useState } from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, Search, Filter, ChevronDown, Tags } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const categories = [...new Set(drugs.map(d => d.category).filter(Boolean))];

  const filteredDrugs = drugs.filter(drug => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      drug.name.toLowerCase().includes(searchLower) ||
      drug.generic_name.toLowerCase().includes(searchLower) ||
      drug.manufacturer.toLowerCase().includes(searchLower) ||
      drug.aliases?.some(a => a.alias.toLowerCase().includes(searchLower)) ||
      drug.brand_names?.some(b => b.brand_name.toLowerCase().includes(searchLower));

    const matchesStatus =
      statusFilter === 'all' || getDrugStatus(drug.expiry_date) === statusFilter;

    const matchesCategory =
      categoryFilter === 'all' || drug.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const hasExtraNames = (drug: Drug) => 
    (drug.aliases && drug.aliases.length > 0) || (drug.brand_names && drug.brand_names.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, alias, or brand..."
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
                <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[40px]"></TableHead>
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
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No drugs found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredDrugs.map((drug) => {
                const status = getDrugStatus(drug.expiry_date);
                const isExpanded = expandedRows.has(drug.id);
                const hasNames = hasExtraNames(drug);

                return (
                  <Collapsible key={drug.id} asChild open={isExpanded}>
                    <>
                      <TableRow className="drug-row">
                        <TableCell>
                          {hasNames && (
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleRow(drug.id)}
                              >
                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </Button>
                            </CollapsibleTrigger>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {drug.name}
                            {hasNames && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Tags className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Has aliases/brand names
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{drug.generic_name}</TableCell>
                        <TableCell>{drug.manufacturer}</TableCell>
                        <TableCell className="font-mono text-sm">{drug.batch_number}</TableCell>
                        <TableCell>{format(new Date(drug.expiry_date), 'MMM dd, yyyy')}</TableCell>
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
                      {hasNames && (
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={9} className="py-3">
                              <div className="flex gap-8 pl-8">
                                {drug.aliases && drug.aliases.length > 0 && (
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aliases</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {drug.aliases.map((alias) => (
                                        <Badge key={alias.id} variant="secondary" className="text-xs">
                                          {alias.alias}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {drug.brand_names && drug.brand_names.length > 0 && (
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand Names</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {drug.brand_names.map((brand) => (
                                        <Badge key={brand.id} variant="outline" className="text-xs">
                                          {brand.brand_name}
                                          {brand.brand_manufacturer && (
                                            <span className="text-muted-foreground ml-1">({brand.brand_manufacturer})</span>
                                          )}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      )}
                    </>
                  </Collapsible>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
