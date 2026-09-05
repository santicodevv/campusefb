import { Lock } from 'lucide-react';
import { Button } from '@/shared/components/ui';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
}

export function SessionExpiredModal({ isOpen, onAcknowledge }: SessionExpiredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border border-red-50 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mb-4 mx-auto border border-red-100">
          <Lock className="h-7 w-7 text-red-600 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          🔒 Sesión cerrada
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Tu sesión fue cerrada automáticamente por inactividad para proteger tu información.
        </p>
        <Button
          onClick={onAcknowledge}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-blue-200 transition-all"
        >
          Volver a ingresar
        </Button>
      </div>
    </div>
  );
}
