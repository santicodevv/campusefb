import { Card, CardContent, Badge } from '@/shared/components/ui';
import { CheckCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import type { DashboardStats } from '../../types/dashboard.types';

interface ActivePeriodCardProps {
  activePeriod: DashboardStats['activePeriod'] | undefined;
}

export function ActivePeriodCard({ activePeriod }: ActivePeriodCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Período Activo</h3>
          {activePeriod ? (
            <Badge variant="success">
              <CheckCircle className="h-3 w-3 mr-1" />
              Activo
            </Badge>
          ) : (
            <Badge variant="warning">
              <Clock className="h-3 w-3 mr-1" />
              Sin período activo
            </Badge>
          )}
        </div>
        {activePeriod ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">{activePeriod.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(activePeriod.startDate).toLocaleDateString()} -{' '}
                  {new Date(activePeriod.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            No hay período académico activo
          </div>
        )}
      </CardContent>
    </Card>
  );
}
