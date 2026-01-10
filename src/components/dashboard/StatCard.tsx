import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'expired' | 'expiring' | 'safe' | 'value';
  description?: string;
  trend?: { value: number; positive: boolean };
}

export function StatCard({ title, value, icon: Icon, variant = 'default', description, trend }: StatCardProps) {
  const variantStyles = {
    default: 'border-border/50',
    expired: 'border-expired/30 bg-gradient-to-br from-expired/5 to-expired/10',
    expiring: 'border-expiring/30 bg-gradient-to-br from-expiring/5 to-expiring/10',
    safe: 'border-safe/30 bg-gradient-to-br from-safe/5 to-safe/10',
    value: 'border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10',
  };

  const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    expired: 'bg-expired/10 text-expired',
    expiring: 'bg-expiring/10 text-expiring',
    safe: 'bg-safe/10 text-safe',
    value: 'bg-primary/10 text-primary',
  };

  return (
    <div className={cn('stat-card border', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold font-display tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <p className={cn('text-xs font-medium flex items-center gap-1', trend.positive ? 'text-safe' : 'text-expired')}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-muted-foreground font-normal">vs last month</span>
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
