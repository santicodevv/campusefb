import { Card, CardContent, Badge, Button } from '@/shared/components/ui';
import { CheckCircle, XCircle, ClipboardList } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';

interface GradeEditSessionCardProps {
  editSessionStatus: { isActive: boolean } | undefined;
  toggleEditSession: UseMutationResult<unknown, Error, void>;
}

export function GradeEditSessionCard({ editSessionStatus, toggleEditSession }: GradeEditSessionCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edición de Notas</h3>
          {editSessionStatus?.isActive ? (
            <Badge variant="success">
              <CheckCircle className="h-3 w-3 mr-1" />
              Habilitada
            </Badge>
          ) : (
            <Badge variant="secondary">
              <XCircle className="h-3 w-3 mr-1" />
              Deshabilitada
            </Badge>
          )}
        </div>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {editSessionStatus?.isActive
              ? 'Los profesores pueden editar calificaciones. Una vez que guardan una nota, no podrán modificarla.'
              : 'Los profesores no pueden editar calificaciones actualmente.'}
          </p>
          <Button
            variant={editSessionStatus?.isActive ? 'danger' : 'primary'}
            className="w-full"
            onClick={() => toggleEditSession.mutate()}
            disabled={toggleEditSession.isPending}
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            {editSessionStatus?.isActive ? 'Deshabilitar Edición' : 'Habilitar Edición'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
