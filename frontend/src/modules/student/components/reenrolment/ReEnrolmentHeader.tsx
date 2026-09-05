import { RefreshCw } from 'lucide-react';

export function ReEnrolmentHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <RefreshCw className="h-7 w-7 text-blue-600" />
        Reinscripción
      </h1>
      <p className="mt-1 text-gray-600">
        Solicita tu reinscripción para el próximo período académico
      </p>
    </div>
  );
}
