import { RefreshCw } from 'lucide-react';

export function ReEnrolmentsHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <RefreshCw className="h-7 w-7 text-blue-600" />
        Solicitudes de Reinscripción
      </h1>
      <p className="mt-1 text-gray-600">
        Revisa y gestiona las solicitudes de reinscripción de estudiantes
      </p>
    </div>
  );
}
