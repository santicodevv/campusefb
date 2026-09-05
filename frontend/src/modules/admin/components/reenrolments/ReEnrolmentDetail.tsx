import { Card, CardContent, Button, Badge } from '@/shared/components/ui';
import { ArrowLeft, FileText, User, BookOpen, CheckCircle, XCircle, Trash2, Calendar, Edit } from 'lucide-react';
import type { ReEnrolmentRequest } from '@/shared/types';
import { getStatusBadge } from './utils';
import type { UseMutationResult } from '@tanstack/react-query';

interface ReEnrolmentDetailProps {
  selectedRequest: ReEnrolmentRequest;
  backToList: () => void;
  setEditCoursesModalOpen: (open: boolean) => void;
  approveMutation: UseMutationResult<unknown, Error, number, unknown>;
  applyMutation: UseMutationResult<unknown, Error, number, unknown>;
  openRejectModal: (id: number) => void;
  rejectMutation: UseMutationResult<unknown, Error, { id: number; reason: string }, unknown>;
  deleteMutation: UseMutationResult<unknown, Error, number, unknown>;
}

export function ReEnrolmentDetail({
  selectedRequest,
  backToList,
  setEditCoursesModalOpen,
  approveMutation,
  applyMutation,
  openRejectModal,
  rejectMutation,
  deleteMutation,
}: ReEnrolmentDetailProps) {
  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" onClick={backToList} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la lista
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-7 w-7 text-blue-600" />
          Solicitud #{selectedRequest.id}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Información del Estudiante
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium">{selectedRequest.student?.displayName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedRequest.student?.email || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Cursos Seleccionados ({selectedRequest.lines?.length || 0})
              </h2>
              {selectedRequest.lines && selectedRequest.lines.length > 0 ? (
                <div className="space-y-3">
                  {selectedRequest.lines.map((line) => (
                    <div
                      key={line.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <BookOpen className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {line.courseName || `Curso ID: ${line.courseMoodleId}`}
                          </p>
                          <p className="text-sm text-gray-500">Moodle ID: {line.courseMoodleId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {line.status === 'done' && <Badge variant="success">Inscrito</Badge>}
                        {line.status === 'pending' && <Badge variant="secondary">Pendiente</Badge>}
                        {line.status === 'failed' && (
                          <Badge variant="error" title={line.lastError}>
                            Error
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay cursos seleccionados</p>
              )}
            </CardContent>
          </Card>

          {selectedRequest.notes && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Notas del Estudiante</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedRequest.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Estado</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedRequest.status)}
                </div>

                {selectedRequest.status === 'submitted' && (
                  <div className="pt-4 border-t space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setEditCoursesModalOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Cursos
                    </Button>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => approveMutation.mutate(selectedRequest.id)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {approveMutation.isPending ? 'Aprobando...' : 'Aprobar Solicitud'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => openRejectModal(selectedRequest.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar Solicitud
                    </Button>
                  </div>
                )}

                {selectedRequest.status === 'approved' && (
                  <div className="pt-4 border-t space-y-2">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => applyMutation.mutate(selectedRequest.id)}
                      disabled={applyMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {applyMutation.isPending ? 'Aplicando...' : 'Aplicar e Inscribir'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => openRejectModal(selectedRequest.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar Solicitud
                    </Button>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => {
                      if (confirm('¿Eliminar esta solicitud? Esta accion no se puede deshacer.')) {
                        deleteMutation.mutate(selectedRequest.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Solicitud
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Período
              </h2>
              <div className="space-y-2">
                <p className="font-medium">{selectedRequest.period?.name || 'N/A'}</p>
                <p className="text-sm text-gray-500">
                  Código: {selectedRequest.period?.code || 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Fechas</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Creada</p>
                  <p>{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
                {selectedRequest.submittedAt && (
                  <div>
                    <p className="text-gray-500">Enviada</p>
                    <p>{new Date(selectedRequest.submittedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedRequest.decidedAt && (
                  <div>
                    <p className="text-gray-500">Procesada</p>
                    <p>{new Date(selectedRequest.decidedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
