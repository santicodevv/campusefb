import { Modal, ModalFooter, Button, Label, Input } from '@/shared/components/ui';
import type { UseMutationResult } from '@tanstack/react-query';

interface PeriodEditFormData {
  id: number;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface PeriodEditModalProps {
  showEditForm: boolean;
  setShowEditForm: (show: boolean) => void;
  editPeriodData: PeriodEditFormData;
  setEditPeriodData: React.Dispatch<React.SetStateAction<PeriodEditFormData>>;
  updatePeriodMutation: UseMutationResult<unknown, Error, { id: number; data: PeriodEditFormData }, unknown>;
}

export function PeriodEditModal({
  showEditForm,
  setShowEditForm,
  editPeriodData,
  setEditPeriodData,
  updatePeriodMutation,
}: PeriodEditModalProps) {
  return (
    <Modal
      isOpen={showEditForm}
      onClose={() => setShowEditForm(false)}
      title="Editar Período Académico"
      description="Modifica los datos del período seleccionado"
      size="md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updatePeriodMutation.mutate({ id: editPeriodData.id, data: editPeriodData });
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="edit-code">Código</Label>
          <Input
            id="edit-code"
            value={editPeriodData.code}
            onChange={(e) => setEditPeriodData({ ...editPeriodData, code: e.target.value })}
            placeholder="Ej: 2026.2"
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-name">Nombre</Label>
          <Input
            id="edit-name"
            value={editPeriodData.name}
            onChange={(e) => setEditPeriodData({ ...editPeriodData, name: e.target.value })}
            placeholder="Ej: Segundo Semestre 2026"
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-startDate">Fecha de Inicio</Label>
          <Input
            id="edit-startDate"
            type="date"
            value={editPeriodData.startDate}
            onChange={(e) => setEditPeriodData({ ...editPeriodData, startDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-endDate">Fecha de Fin</Label>
          <Input
            id="edit-endDate"
            type="date"
            value={editPeriodData.endDate}
            onChange={(e) => setEditPeriodData({ ...editPeriodData, endDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-description">Descripción</Label>
          <Input
            id="edit-description"
            value={editPeriodData.description}
            onChange={(e) => setEditPeriodData({ ...editPeriodData, description: e.target.value })}
            placeholder="Descripción del período..."
          />
        </div>
        <ModalFooter>
          <Button type="submit" disabled={updatePeriodMutation.isPending}>
            Guardar Cambios
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowEditForm(false)}>
            Cancelar
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
