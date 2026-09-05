import { Button } from '@/shared/components/ui';
import { Calendar, Plus } from 'lucide-react';

interface PeriodsHeaderProps {
  viewMode: 'list' | 'detail' | 'courses';
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
}

export function PeriodsHeader({ viewMode, showCreateForm, setShowCreateForm }: PeriodsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-7 w-7 text-blue-600" />
          Períodos Académicos
        </h1>
        <p className="mt-1 text-gray-600">
          Gestiona los períodos académicos y configura reinscripciones
        </p>
      </div>
      {viewMode === 'list' && (
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Período
        </Button>
      )}
    </div>
  );
}
