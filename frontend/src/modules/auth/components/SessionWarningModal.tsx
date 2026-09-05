import { AlertTriangle, LogOut, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui';

interface SessionWarningModalProps {
  show: boolean;
  timeLeft: number;
  onLogout: () => void;
  onRenew: () => void;
}

export function SessionWarningModal({ show, timeLeft, onLogout, onRenew }: SessionWarningModalProps) {
  if (!show) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border border-amber-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center mb-4 border border-amber-200">
            <AlertTriangle className="h-7 w-7 text-amber-600 animate-bounce" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            ¿Sigues ahí?
          </h2>
          
          <p className="text-gray-600 mb-6">
            Tu sesión se cerrará en{' '}
            <span className="font-bold text-amber-600 text-lg tabular-nums">
              {formatTime(timeLeft)}
            </span>{' '}
            minutos por inactividad.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="outline"
              onClick={onLogout}
              className="w-full sm:order-1 flex items-center justify-center gap-2 border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              <LogOut className="h-4 w-4 text-gray-500" />
              Cerrar Sesión
            </Button>
            <Button
              onClick={onRenew}
              className="w-full sm:order-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-200"
            >
              <CheckCircle className="h-4 w-4" />
              Sigo aquí
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
