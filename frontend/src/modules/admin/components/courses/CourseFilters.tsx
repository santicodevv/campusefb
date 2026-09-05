
import { Search } from 'lucide-react';
import { Card, CardContent, Input } from '@/shared/components/ui';

interface CourseFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  setPage: (page: number) => void;
}

export function CourseFilters({ search, setSearch, setPage }: CourseFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, grupo o código..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
