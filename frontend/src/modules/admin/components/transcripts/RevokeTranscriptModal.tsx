import { Modal, Button, Spinner } from '@/shared/components/ui';
import { AlertTriangle, XCircle } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Transcript } from '../../hooks/useAdminTranscripts';

interface RevokeTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTranscript: Transcript | null;
  revokeReason: string;
  setRevokeReason: (reason: string) => void;
  handleRevoke: () => void;
  revokeMutation: UseMutationResult<unknown, Error, { id: number; reason: string }, unknown>;
}

export function RevokeTranscriptModal({
  isOpen,
  onClose,
  selectedTranscript,
  revokeReason,
  setRevokeReason,
  handleRevoke,
  revokeMutation,
}: RevokeTranscriptModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Revocar Constancia">
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Esta acción no se puede deshacer</p>
              <p className="text-sm text-yellow-700">
                La constancia {selectedTranscript?.transcriptNumber} será marcada como revocada y no podrá ser
                utilizada como documento oficial.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo de revocación *
          </label>
          <textarea
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            rows={3}
            placeholder="Ingresa el motivo de la revocación..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleRevoke} disabled={revokeMutation.isPending}>
            {revokeMutation.isPending ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Revocar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
