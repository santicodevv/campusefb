import { Card, CardContent, Spinner, Badge, Button } from '@/shared/components/ui';
import { Clock, CheckCircle, XCircle, BookOpen, AlertCircle, Plus, Send } from 'lucide-react';
import type { AcademicPeriod } from '@/shared/types';
import type { ReEnrolmentRequest } from '@/shared/types';
import type { ViewMode } from '../../hooks/useStudentReEnrolment';
import type { UseMutationResult } from '@tanstack/react-query';

type ApiError = { response?: { data?: { message?: string } } };

interface ReEnrolmentHistoryProps {
  loadingRequests: boolean;
  myRequests?: ReEnrolmentRequest[];
  openPeriods?: AcademicPeriod[];
  handleSelectPeriod: (period: AcademicPeriod) => void;
  submitMutation: UseMutationResult<unknown, ApiError, number, unknown>;
  setViewMode: (mode: ViewMode) => void;
}

export function ReEnrolmentHistory({
  loadingRequests,
  myRequests,
  openPeriods,
  handleSelectPeriod,
  submitMutation,
  setViewMode,
}: ReEnrolmentHistoryProps) {
  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: 'secondary' | 'warning' | 'info' | 'error' | 'success'; icon: React.ComponentType<{ className?: string }>; label: string }> = {
      draft: { variant: 'secondary', icon: Clock, label: 'Borrador' },
      submitted: { variant: 'warning', icon: Clock, label: 'En revisión' },
      approved: { variant: 'info', icon: CheckCircle, label: 'Aprobada' },
      rejected: { variant: 'error', icon: XCircle, label: 'Rechazada' },
      applied: { variant: 'success', icon: CheckCircle, label: 'Aplicada' },
    };
    const config = configs[status] || configs.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loadingRequests) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!myRequests || myRequests.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No tienes solicitudes</p>
            <p className="text-sm mb-4">Aún no has realizado ninguna solicitud de reinscripción</p>
            <Button onClick={() => setViewMode('periods')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {myRequests.map((request) => (
        <Card key={request.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {getStatusBadge(request.status)}
                  <span className="text-sm text-gray-500">
                    Creada: {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {request.period?.name || `Período ${request.periodId}`}
                  </h3>
                  <p className="text-sm text-gray-500">Código: {request.period?.code}</p>
                </div>

                {request.lines && request.lines.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Cursos solicitados ({request.lines.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {request.lines.map((line) => (
                        <Badge key={line.id} variant="secondary">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {line.courseName || `Curso ${line.courseMoodleId}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {request.status === 'rejected' && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">
                      <strong>Motivo:</strong> {request.rejectionReason || 'No especificado'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {request.status === 'draft' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const period = openPeriods?.find((p) => p.id === request.periodId);
                        if (period) {
                          handleSelectPeriod(period);
                        }
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => submitMutation.mutate(request.id)}
                      disabled={submitMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
