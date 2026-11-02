import { useState } from 'react';
import { Modal, Button, Label } from '@/shared/components/ui';
import type { StudentGradeWithDetails } from '@/shared/types';

interface TeacherCorrectionReasonModalProps {
  student: StudentGradeWithDetails | null;
  newGrade: number | null | undefined;
  isPending: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function TeacherCorrectionReasonModal({ student, newGrade, isPending, onConfirm, onCancel }: TeacherCorrectionReasonModalProps) {
  const [reason, setReason] = useState('');

  const handleClose = () => {
    setReason('');
    onCancel();
  };

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setReason('');
  };

  return (
    <Modal isOpen={student !== null} onClose={handleClose} title="Corregir nota final" size="sm">
      {student && (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            <strong>{student.studentName}</strong>: {student.totalGrade} → {newGrade ?? student.totalGrade}
          </p>
          <div className="space-y-1">
            <Label htmlFor="correction-reason">Motivo de la corrección</Label>
            <textarea
              id="correction-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej.: error al registrar la nota del examen final"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isPending || !reason.trim()}>
              Guardar corrección
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
