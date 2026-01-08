import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { DrugStatus } from '@/types/drug';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: DrugStatus;
}

const statusConfig = {
  expired: {
    label: 'Expired',
    icon: XCircle,
    className: 'status-expired',
  },
  expiring: {
    label: 'Expiring Soon',
    icon: AlertTriangle,
    className: 'status-expiring',
  },
  safe: {
    label: 'Safe',
    icon: CheckCircle,
    className: 'status-safe',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn('status-badge', config.className)}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
