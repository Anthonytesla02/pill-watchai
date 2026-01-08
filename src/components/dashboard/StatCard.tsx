import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: 'default' | 'expired' | 'expiring' | 'safe';
  description?: string;
}

const variantStyles = {
  default: 'border-l-4 border-l-primary',
  expired: 'border-l-4 border-l-expired',
  expiring: 'border-l-4 border-l-expiring',
  safe: 'border-l-4 border-l-safe',
};

const iconStyles = {
  default: 'text-primary bg-primary/10',
  expired: 'text-expired bg-expired/10',
  expiring: 'text-expiring bg-expiring/10',
  safe: 'text-safe bg-safe/10',
};

export function StatCard({ title, value, icon: Icon, variant, description }: StatCardProps) {
  return (
    <div className={cn('stat-card', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold font-display tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
