import { Badge } from '@/shared/components/ui';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { ReEnrolmentStatus } from '@/shared/types';

export const getStatusBadge = (status: ReEnrolmentStatus) => {
  switch (status) {
    case 'draft':
      return (
        <Badge variant="secondary">
          <FileText className="h-3 w-3 mr-1" />
          Borrador
        </Badge>
      );
    case 'submitted':
      return (
        <Badge variant="warning">
          <Clock className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="info">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprobada
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="error">
          <XCircle className="h-3 w-3 mr-1" />
          Rechazada
        </Badge>
      );
    case 'applied':
      return (
        <Badge variant="success">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aplicada
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};
