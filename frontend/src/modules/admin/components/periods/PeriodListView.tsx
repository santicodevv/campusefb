import { Card, CardContent, Spinner, Button, Badge } from '@/shared/components/ui';
import { Calendar, Play, ChevronRight, AlertCircle, Plus } from 'lucide-react';
import type { AcademicPeriod } from '@/shared/types';
import { getStatusBadge } from './utils';

interface PeriodListViewProps {
  periods: AcademicPeriod[] | undefined;
  loadingPeriods: boolean;
  handleSelectPeriod: (period: AcademicPeriod) => void;
  setShowCreateForm: (show: boolean) => void;
}

export function PeriodListView({
  periods,
  loadingPeriods,
  handleSelectPeriod,
  setShowCreateForm,
}: PeriodListViewProps) {
  if (loadingPeriods) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!periods || periods.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No hay períodos académicos</p>
            <p className="text-sm mb-4">Crea un nuevo período para comenzar</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Período
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {periods.map((period) => (
        <Card
          key={period.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleSelectPeriod(period)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{period.name}</h3>
                    {getStatusBadge(period.status)}
                    {period.reenrolmentOpen && (
                      <Badge variant="info">
                        <Play className="h-3 w-3 mr-1" />
                        Reinscripción Activa
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Código: {period.code} | {new Date(period.startDate).toLocaleDateString()} -{' '}
                    {new Date(period.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
