import { Button, Spinner } from '@/shared/components/ui';
import { X } from 'lucide-react';

interface RejectModalProps {
  rejectModalOpen: boolean;
  setRejectModalOpen: (open: boolean) => void;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  handleReject: () => void;
  isPending: boolean;
}

export function RejectModal({
  rejectModalOpen,
  setRejectModalOpen,
  rejectReason,
  setRejectReason,
  handleReject,
  isPending,
}: RejectModalProps) {
  if (!rejectModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Rechazar Solicitud</h3>
          <Button variant="ghost" size="sm" onClick={() => setRejectModalOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Motivo del rechazo *</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Indica el motivo por el cual se rechaza esta solicitud..."
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleReject} disabled={!rejectReason.trim() || isPending}>
            {isPending ? <Spinner className="h-4 w-4" /> : 'Confirmar Rechazo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
