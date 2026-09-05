import { Card, CardContent, Button } from '@/shared/components/ui';
import { CheckCircle } from 'lucide-react';
import type { ReconcileResult } from '../../hooks/useAdminSync';

interface SyncReconcileResultProps {
  showReconcileResult: ReconcileResult | null;
  setShowReconcileResult: (result: ReconcileResult | null) => void;
}

export function SyncReconcileResult({
  showReconcileResult,
  setShowReconcileResult,
}: SyncReconcileResultProps) {
  if (!showReconcileResult) return null;

  return (
    <Card className="mb-6 border-2 border-green-200 bg-green-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Resultado de Reconciliación</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowReconcileResult(null)}>
            Cerrar
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700 mb-2">Antes</p>
            {Object.entries(showReconcileResult.before).map(([key, value]) => (
              <p key={key} className="text-gray-600">
                {key}: {value}
              </p>
            ))}
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-2">Después</p>
            {Object.entries(showReconcileResult.after).map(([key, value]) => (
              <p key={key} className="text-gray-600">
                {key}: {value}
              </p>
            ))}
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-2">Diferencias</p>
            {Object.entries(showReconcileResult.differences).map(([key, value]) => (
              <p
                key={key}
                className={value !== 0 ? 'text-green-600 font-medium' : 'text-gray-600'}
              >
                {key}: {value > 0 ? `+${value}` : value}
              </p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
