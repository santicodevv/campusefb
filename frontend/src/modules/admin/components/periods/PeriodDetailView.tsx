import { Card, CardContent, Button, Badge, Label, Input } from '@/shared/components/ui';
import { Play, Square, Pencil, Trash2, Settings, Save, X, BookOpen, ChevronRight } from 'lucide-react';
import type { AcademicPeriod } from '@/shared/types';
import toast from 'react-hot-toast';
import { getStatusBadge } from './utils';
import type { UseMutationResult } from '@tanstack/react-query';

interface PeriodDetailViewProps {
  selectedPeriod: AcademicPeriod;
  setViewMode: (mode: 'list' | 'detail' | 'courses') => void;
  setSelectedPeriod: (period: AcademicPeriod | null) => void;
  openPeriodMutation: UseMutationResult<unknown, Error, number, unknown>;
  closePeriodMutation: UseMutationResult<unknown, Error, number, unknown>;
  deletePeriodMutation: UseMutationResult<unknown, Error, number, unknown>;
  setEditPeriodData: (data: { id: number; code: string; name: string; startDate: string; endDate: string; description: string }) => void;
  setShowEditForm: (show: boolean) => void;
  showReenrolmentConfig: boolean;
  setShowReenrolmentConfig: (show: boolean) => void;
  reenrolmentConfig: { reenrolmentStartDate: string; reenrolmentEndDate: string };
  setReenrolmentConfig: (config: { reenrolmentStartDate: string; reenrolmentEndDate: string }) => void;
  configReenrolmentMutation: UseMutationResult<unknown, Error, { id: number; data: { reenrolmentStartDate: string; reenrolmentEndDate: string } }, unknown>;
  openReenrolmentMutation: UseMutationResult<unknown, Error, number, unknown>;
  closeReenrolmentMutation: UseMutationResult<unknown, Error, number, unknown>;
}

export function PeriodDetailView({
  selectedPeriod,
  setViewMode,
  setSelectedPeriod,
  openPeriodMutation,
  closePeriodMutation,
  deletePeriodMutation,
  setEditPeriodData,
  setShowEditForm,
  showReenrolmentConfig,
  setShowReenrolmentConfig,
  reenrolmentConfig,
  setReenrolmentConfig,
  configReenrolmentMutation,
  openReenrolmentMutation,
  closeReenrolmentMutation,
}: PeriodDetailViewProps) {
  return (
    <div>
      <button
        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mb-6"
        onClick={() => {
          setViewMode('list');
          setSelectedPeriod(null);
        }}
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        Volver a períodos
      </button>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{selectedPeriod.name}</h2>
                {getStatusBadge(selectedPeriod.status)}
                {selectedPeriod.reenrolmentOpen && (
                  <Badge variant="info">
                    <Play className="h-3 w-3 mr-1" />
                    Reinscripción Activa
                  </Badge>
                )}
              </div>
              <p className="text-gray-500">Código: {selectedPeriod.code}</p>
              <p className="text-sm text-gray-500 mt-2">
                Período: {new Date(selectedPeriod.startDate).toLocaleDateString()} -{' '}
                {new Date(selectedPeriod.endDate).toLocaleDateString()}
              </p>
              {selectedPeriod.reenrolmentStartDate && selectedPeriod.reenrolmentEndDate && (
                <p className="text-sm text-gray-500">
                  Reinscripción:{' '}
                  {new Date(selectedPeriod.reenrolmentStartDate).toLocaleDateString()} -{' '}
                  {new Date(selectedPeriod.reenrolmentEndDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {selectedPeriod.status === 'planned' && (
                <Button onClick={() => openPeriodMutation.mutate(selectedPeriod.id)} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Abrir Período
                </Button>
              )}
              {selectedPeriod.status === 'open' && (
                <Button variant="outline" onClick={() => closePeriodMutation.mutate(selectedPeriod.id)} className="w-full">
                  <Square className="h-4 w-4 mr-2" />
                  Cerrar Período
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => {
                  setEditPeriodData({
                    id: selectedPeriod.id,
                    code: selectedPeriod.code,
                    name: selectedPeriod.name,
                    startDate: selectedPeriod.startDate ? selectedPeriod.startDate.split('T')[0] : '',
                    endDate: selectedPeriod.endDate ? selectedPeriod.endDate.split('T')[0] : '',
                    description: selectedPeriod.description || '',
                  });
                  setShowEditForm(true);
                }}
                className="w-full"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm('¿Estás seguro de eliminar este período? Esta acción no se puede deshacer.')) {
                    deletePeriodMutation.mutate(selectedPeriod.id);
                  }
                }}
                disabled={deletePeriodMutation.isPending}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Reinscripción
            </h3>

            {showReenrolmentConfig ? (
              <div className="space-y-4">
                <div>
                  <Label>Fecha inicio reinscripción</Label>
                  <Input
                    type="date"
                    value={reenrolmentConfig.reenrolmentStartDate}
                    onChange={(e) =>
                      setReenrolmentConfig({ ...reenrolmentConfig, reenrolmentStartDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Fecha fin reinscripción</Label>
                  <Input
                    type="date"
                    value={reenrolmentConfig.reenrolmentEndDate}
                    onChange={(e) =>
                      setReenrolmentConfig({ ...reenrolmentConfig, reenrolmentEndDate: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const start = reenrolmentConfig.reenrolmentStartDate;
                      const end = reenrolmentConfig.reenrolmentEndDate;
                      if (start && end && start >= end) {
                        toast.error('La fecha de inicio de reinscripción debe ser anterior a la fecha de fin');
                        return;
                      }
                      configReenrolmentMutation.mutate({ id: selectedPeriod.id, data: reenrolmentConfig });
                    }}
                    disabled={configReenrolmentMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={() => setShowReenrolmentConfig(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  {selectedPeriod.reenrolmentStartDate && selectedPeriod.reenrolmentEndDate ? (
                    <>
                      <p>Inicio: {new Date(selectedPeriod.reenrolmentStartDate).toLocaleDateString()}</p>
                      <p>Fin: {new Date(selectedPeriod.reenrolmentEndDate).toLocaleDateString()}</p>
                    </>
                  ) : (
                    <p className="text-gray-400">No configurado</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowReenrolmentConfig(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Fechas
                  </Button>
                  {selectedPeriod.reenrolmentStartDate &&
                    selectedPeriod.reenrolmentEndDate &&
                    !selectedPeriod.reenrolmentOpen && (
                      <Button
                        onClick={() => openReenrolmentMutation.mutate(selectedPeriod.id)}
                        disabled={openReenrolmentMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Abrir Reinscripción
                      </Button>
                    )}
                  {selectedPeriod.reenrolmentOpen && (
                    <Button
                      variant="outline"
                      onClick={() => closeReenrolmentMutation.mutate(selectedPeriod.id)}
                      disabled={closeReenrolmentMutation.isPending}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Cerrar Reinscripción
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Cursos Disponibles
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Gestiona qué cursos estarán disponibles para reinscripción en este período.
            </p>
            <Button onClick={() => setViewMode('courses')}>
              <Settings className="h-4 w-4 mr-2" />
              Gestionar Cursos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
