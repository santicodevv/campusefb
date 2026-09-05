import { Modal, Select, Button, Spinner } from '@/shared/components/ui';
import { FileText } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Student, Period } from '../../hooks/useAdminTranscripts';

interface GenerateTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  students?: Student[];
  periods?: Period[];
  generateForm: { studentId: string; periodId: string };
  setGenerateForm: (form: { studentId: string; periodId: string }) => void;
  handleGenerate: () => void;
  generateMutation: UseMutationResult<unknown, Error, { studentId: number; periodId?: number }, unknown>;
}

export function GenerateTranscriptModal({
  isOpen,
  onClose,
  students,
  periods,
  generateForm,
  setGenerateForm,
  handleGenerate,
  generateMutation,
}: GenerateTranscriptModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generar Constancia">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estudiante *
          </label>
          <Select
            value={generateForm.studentId}
            onChange={(e) => setGenerateForm({ ...generateForm, studentId: e.target.value })}
          >
            <option value="">Seleccionar estudiante...</option>
            {students?.map((student) => (
              <option key={student.id} value={student.id.toString()}>
                {student.displayName} ({student.email})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Período (opcional)
          </label>
          <Select
            value={generateForm.periodId}
            onChange={(e) => setGenerateForm({ ...generateForm, periodId: e.target.value })}
          >
            <option value="">Todos los períodos</option>
            {periods?.map((period) => (
              <option key={period.id} value={period.id.toString()}>
                {period.name} ({period.code})
              </option>
            ))}
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Si no seleccionas período, se generará el récord completo
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Generar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
