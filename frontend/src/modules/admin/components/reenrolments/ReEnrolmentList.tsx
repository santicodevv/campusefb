import { Card, CardContent, Spinner, Button } from '@/shared/components/ui';
import { User, Calendar, BookOpen, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { ReEnrolmentRequest } from '@/shared/types';
import { getStatusBadge } from './utils';
import type { UseMutationResult } from '@tanstack/react-query';

interface ReEnrolmentListProps {
  isLoading: boolean;
  requests?: ReEnrolmentRequest[];
  statusFilter: string;
  viewDetail: (request: ReEnrolmentRequest) => void;
  approveMutation: UseMutationResult<unknown, Error, number, unknown>;
  applyMutation: UseMutationResult<unknown, Error, number, unknown>;
  openRejectModal: (id: number) => void;
  rejectMutation: UseMutationResult<unknown, Error, { id: number; reason: string }, unknown>;
}

export function ReEnrolmentList({
  isLoading,
  requests,
  statusFilter,
  viewDetail,
  approveMutation,
  applyMutation,
  openRejectModal,
  rejectMutation,
}: ReEnrolmentListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No hay solicitudes</p>
            <p className="text-sm">
              {statusFilter === 'submitted'
                ? 'No hay solicitudes pendientes de revisión'
                : 'No se encontraron solicitudes con los filtros seleccionados'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {getStatusBadge(request.status)}
                  <span className="text-sm text-gray-500">#{request.id}</span>
                  {request.submittedAt && (
                    <span className="text-sm text-gray-500">
                      Enviada: {new Date(request.submittedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estudiante</p>
                      <p className="font-medium text-gray-900">
                        {request.student?.displayName || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">{request.student?.email || ''}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Período</p>
                      <p className="font-medium text-gray-900">{request.period?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{request.period?.code || ''}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <BookOpen className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cursos</p>
                      <p className="font-medium text-gray-900">
                        {request.lines?.length || 0} cursos seleccionados
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => viewDetail(request)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalle
                </Button>
                {request.status === 'submitted' && (
                  <>
                    <Button
                      onClick={(e) => { e.stopPropagation(); approveMutation.mutate(request.id); }}
                      disabled={approveMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {approveMutation.isPending ? 'Aprobando...' : 'Aprobar'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); openRejectModal(request.id); }}
                      disabled={rejectMutation.isPending}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                  </>
                )}
                {request.status === 'approved' && (
                  <>
                    <Button
                      onClick={(e) => { e.stopPropagation(); applyMutation.mutate(request.id); }}
                      disabled={applyMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {applyMutation.isPending ? 'Aplicando...' : 'Aplicar'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); openRejectModal(request.id); }}
                      disabled={rejectMutation.isPending}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar
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
