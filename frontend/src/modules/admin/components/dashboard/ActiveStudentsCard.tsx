import { Card, CardContent, Badge, Spinner } from '@/shared/components/ui';
import { Users, AlertCircle } from 'lucide-react';
import { getInitials, formatRelativeTime } from '../../hooks/useAdminDashboard';
import type { ActiveStudent } from '../../types/dashboard.types';

interface ActiveStudentsCardProps {
  activeStudents: ActiveStudent[] | undefined;
  studentsLoading: boolean;
}

export function ActiveStudentsCard({ activeStudents, studentsLoading }: ActiveStudentsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Estudiantes Activos</h3>
          <Badge variant="info">
            <Users className="h-3 w-3 mr-1" />
            Último acceso
          </Badge>
        </div>
        {studentsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : activeStudents && activeStudents.length > 0 ? (
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {activeStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                    {getInitials(student.firstname, student.lastname)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {student.firstname} {student.lastname}
                    </p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatRelativeTime(student.lastAccess)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            No hay datos de actividad
          </div>
        )}
      </CardContent>
    </Card>
  );
}
