import { Card, CardContent, Input, Select } from '@/shared/components/ui';
import { Search } from 'lucide-react';

interface TranscriptsFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  setPage: (page: number) => void;
}

export function TranscriptsFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  setPage,
}: TranscriptsFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por número o estudiante..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-48"
          >
            <option value="">Todos los estados</option>
            <option value="generated">Activas</option>
            <option value="revoked">Revocadas</option>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
