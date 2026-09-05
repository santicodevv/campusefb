import { Badge } from '@/shared/components/ui';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export const getStatusBadge = (status: string) => {
  const configs: Record<string, { variant: "secondary" | "success" | "error"; icon: React.ElementType; label: string }> = {
    planned: { variant: 'secondary', icon: Clock, label: 'Planificado' },
    open: { variant: 'success', icon: CheckCircle, label: 'Abierto' },
    closed: { variant: 'error', icon: XCircle, label: 'Cerrado' },
  };
  const config = configs[status] || configs.planned;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};
