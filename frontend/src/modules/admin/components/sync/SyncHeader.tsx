import { Database } from 'lucide-react';

export function SyncHeader() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="h-7 w-7 text-blue-600" />
          Sincronización con Moodle
        </h1>
        <p className="mt-1 text-gray-600">
          Gestiona la sincronización de datos entre EFB y Moodle
        </p>
      </div>
    </div>
  );
}
