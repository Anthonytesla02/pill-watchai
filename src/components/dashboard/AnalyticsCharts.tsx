import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Drug, DrugStatus } from '@/types/drug';

interface AnalyticsChartsProps {
  drugs: Drug[];
  getDrugStatus: (date: string) => DrugStatus;
}

const STATUS_COLORS = {
  expired: 'hsl(0 84% 60%)',
  expiring: 'hsl(38 92% 50%)',
  safe: 'hsl(142 71% 45%)',
};

const CATEGORY_COLORS = [
  'hsl(174 72% 40%)',
  'hsl(221 83% 53%)',
  'hsl(262 83% 58%)',
  'hsl(339 90% 51%)',
  'hsl(38 92% 50%)',
  'hsl(142 71% 45%)',
  'hsl(199 89% 48%)',
  'hsl(47 96% 53%)',
  'hsl(280 65% 60%)',
];

export function AnalyticsCharts({ drugs, getDrugStatus }: AnalyticsChartsProps) {
  const statusData = useMemo(() => {
    const expired = drugs.filter(d => getDrugStatus(d.expiry_date) === 'expired').length;
    const expiring = drugs.filter(d => getDrugStatus(d.expiry_date) === 'expiring').length;
    const safe = drugs.filter(d => getDrugStatus(d.expiry_date) === 'safe').length;

    return [
      { name: 'Expired', value: expired, color: STATUS_COLORS.expired },
      { name: 'Expiring Soon', value: expiring, color: STATUS_COLORS.expiring },
      { name: 'Safe', value: safe, color: STATUS_COLORS.safe },
    ].filter(item => item.value > 0);
  }, [drugs, getDrugStatus]);

  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    drugs.forEach(drug => {
      const category = drug.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [drugs]);

  const expiryTimelineData = useMemo(() => {
    const now = new Date();
    const ranges = [
      { label: 'Expired', min: -Infinity, max: 0 },
      { label: '0-30 days', min: 0, max: 30 },
      { label: '31-60 days', min: 31, max: 60 },
      { label: '61-90 days', min: 61, max: 90 },
      { label: '91-180 days', min: 91, max: 180 },
      { label: '180+ days', min: 181, max: Infinity },
    ];

    return ranges.map(range => {
      const count = drugs.filter(drug => {
        const expiry = new Date(drug.expiry_date);
        const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil > range.min && daysUntil <= range.max;
      }).length;

      return {
        range: range.label,
        count,
        fill: range.max <= 0 ? STATUS_COLORS.expired : 
              range.max <= 90 ? STATUS_COLORS.expiring : 
              STATUS_COLORS.safe,
      };
    });
  }, [drugs]);

  const inventoryValueData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    drugs.forEach(drug => {
      const category = drug.category || 'Uncategorized';
      const value = (drug.unit_price || 0) * drug.quantity;
      categoryMap.set(category, (categoryMap.get(category) || 0) + value);
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [drugs]);

  if (drugs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Add drugs to see analytics
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status Distribution */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base font-display">Status Distribution</CardTitle>
          <CardDescription>Overview of drug expiry status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base font-display">Category Breakdown</CardTitle>
          <CardDescription>Drugs by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Expiry Timeline */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base font-display">Expiry Timeline</CardTitle>
          <CardDescription>Drugs by days until expiry</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expiryTimelineData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="range" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value} drugs`, 'Count']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Value by Category */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base font-display">Inventory Value</CardTitle>
          <CardDescription>Value by category (top 6)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryValueData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                />
                <Bar dataKey="value" fill="hsl(174 72% 40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
