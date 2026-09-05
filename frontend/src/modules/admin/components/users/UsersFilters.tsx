import { Search } from 'lucide-react';

interface UsersFiltersProps {
  search: string;
  setSearch: (s: string) => void;
  filterStatus: 'all' | 'active' | 'inactive';
  setFilterStatus: (s: 'all' | 'active' | 'inactive') => void;
  hideRoleFilter?: boolean;
}

export function UsersFilters({
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
}: UsersFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-wrap gap-4 items-center">
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, correo o usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      >
        <option value="all">Todos los estados</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
      </select>
    </div>
  );
}
