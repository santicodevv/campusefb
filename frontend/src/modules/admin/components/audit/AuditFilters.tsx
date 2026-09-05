import { Card, CardContent, Input } from '@/shared/components/ui';
import { Search, Filter } from 'lucide-react';

interface AuditFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  entityFilter: string;
  setEntityFilter: (val: string) => void;
  setPage: (val: number) => void;
  entities: string[];
  filteredCount: number;
}

export function AuditFilters({
  search,
  setSearch,
  entityFilter,
  setEntityFilter,
  setPage,
  entities,
  filteredCount,
}: AuditFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar en el registro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Todas las entidades</option>
              {entities.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            {filteredCount} registros
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
