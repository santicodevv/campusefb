import { Card, CardContent } from '@/shared/components/ui';
import { AlertCircle } from 'lucide-react';

export function SyncInfoCard() {
  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900">Información de Sincronización</h4>
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              <li>
                <strong>Incremental:</strong> Se ejecuta automáticamente cada minuto (solo cambios recientes).
              </li>
              <li>
                <strong>Reconciliación:</strong> Se ejecuta diariamente a las 2:00 AM (sync completo).
              </li>
              <li>
                <strong>Bootstrap:</strong> Usa esto para la primera importación o para reiniciar desde cero.
              </li>
              <li>
                <strong>Watermarks:</strong> El sistema usa timestamps para sincronizar solo datos modificados.
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
