import { Card, CardContent, Button } from '@/shared/components/ui';
import { BookOpen, ClipboardList } from 'lucide-react';

interface TeacherQuickActionsProps {
  hasCourses: boolean;
  firstCourseMoodleId?: number;
  onNavigateCourses: () => void;
  onNavigateGrades: (moodleId: number) => void;
}

export function TeacherQuickActions({
  hasCourses,
  firstCourseMoodleId,
  onNavigateCourses,
  onNavigateGrades,
}: TeacherQuickActionsProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={onNavigateCourses}>
            <BookOpen className="h-4 w-4 mr-2" />
            Ver todos mis cursos
          </Button>
          {hasCourses && firstCourseMoodleId !== undefined && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigateGrades(firstCourseMoodleId)}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Registrar calificaciones
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
