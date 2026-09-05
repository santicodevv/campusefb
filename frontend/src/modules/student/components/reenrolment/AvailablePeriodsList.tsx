import { Card, CardContent, Spinner, Badge } from '@/shared/components/ui';
import { Calendar, AlertCircle, ChevronRight } from 'lucide-react';
import type { AcademicPeriod } from '@/shared/types';

interface AvailablePeriodsListProps {
  loadingPeriods: boolean;
  openPeriods?: AcademicPeriod[];
  myRequests?: Array<{ periodId: number; status: string }>;
  handleSelectPeriod: (period: AcademicPeriod) => void;
}

export function AvailablePeriodsList({
  loadingPeriods,
  openPeriods,
  myRequests,
  handleSelectPeriod,
}: AvailablePeriodsListProps) {
  if (loadingPeriods) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!openPeriods || openPeriods.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No hay períodos disponibles</p>
            <p className="text-sm">Actualmente no hay ningún período con reinscripción abierta</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {openPeriods.map((period) => {
        const hasSubmitted = myRequests?.some((r) => r.periodId === period.id && r.status === 'submitted');
        const hasDraft = myRequests?.some((r) => r.periodId === period.id && r.status === 'draft');

        return (
          <Card
            key={period.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => !hasSubmitted && handleSelectPeriod(period)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{period.name}</h3>
                    <p className="text-sm text-gray-500">Código: {period.code}</p>
                    <p className="text-sm text-gray-500">
                      Reinscripción hasta:{' '}
                      {period.reenrolmentEndDate
                        ? new Date(period.reenrolmentEndDate).toLocaleDateString()
                        : 'Sin fecha límite'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {hasSubmitted && <Badge variant="warning">Ya tienes solicitud</Badge>}
                  {hasDraft && !hasSubmitted && <Badge variant="secondary">Borrador pendiente</Badge>}
                  {!hasSubmitted && <ChevronRight className="h-5 w-5 text-gray-400" />}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
