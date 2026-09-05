import { FileSearch } from 'lucide-react';

export function AuditHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <FileSearch className="h-7 w-7 text-blue-600" />
        Registro de Auditoría
      </h1>
      <p className="mt-1 text-gray-600">
        Historial de actividades y cambios en el sistema
      </p>
    </div>
  );
}
