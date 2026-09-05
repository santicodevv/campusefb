import { Button, Badge } from '@/shared/components/ui';
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react';

interface TeacherGradeEntryHeaderProps {
  courseName?: string;
  courseShortName?: string;
  isEditingEnabled: boolean;
  onBack: () => void;
}

export function TeacherGradeEntryHeader({
  courseName,
  courseShortName,
  isEditingEnabled,
  onBack,
}: TeacherGradeEntryHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{courseShortName || 'Curso'}</h1>
          <p className="text-gray-600">{courseName}</p>
        </div>
      </div>
      {isEditingEnabled ? (
        <Badge variant="success" className="px-3 py-1">
          <CheckCircle className="h-4 w-4 mr-1" /> Edición habilitada
        </Badge>
      ) : (
        <Badge variant="secondary" className="px-3 py-1">
          <Lock className="h-4 w-4 mr-1" /> Edición deshabilitada
        </Badge>
      )}
    </div>
  );
}
