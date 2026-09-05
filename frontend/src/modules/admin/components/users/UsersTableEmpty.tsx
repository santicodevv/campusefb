import { Users as UsersIcon } from 'lucide-react';

interface UsersTableEmptyProps {
  search: string;
  activeFiltersCount: number;
}

export function UsersTableEmpty({ search, activeFiltersCount }: UsersTableEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <UsersIcon className="h-12 w-12 mb-4 text-gray-300" />
      <p className="text-lg font-medium">No se encontraron usuarios</p>
      <p className="text-sm">
        {search || activeFiltersCount > 0
          ? 'Intenta con otros filtros de búsqueda'
          : 'No hay usuarios registrados'}
      </p>
    </div>
  );
}
