import { Button } from '@/shared/components/ui';
import { Calendar, Clock } from 'lucide-react';
import type { ViewMode } from '../../hooks/useStudentReEnrolment';

interface ReEnrolmentTabsProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  resetSelection: () => void;
}

export function ReEnrolmentTabs({ viewMode, setViewMode, resetSelection }: ReEnrolmentTabsProps) {
  return (
    <div className="flex gap-2 mb-6">
      <Button
        variant={viewMode === 'periods' || viewMode === 'select-courses' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => {
          setViewMode('periods');
          resetSelection();
        }}
      >
        <Calendar className="h-4 w-4 mr-2" />
        Períodos Disponibles
      </Button>
      <Button
        variant={viewMode === 'history' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => setViewMode('history')}
      >
        <Clock className="h-4 w-4 mr-2" />
        Mis Solicitudes
      </Button>
    </div>
  );
}
