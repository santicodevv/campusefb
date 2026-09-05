import { GraduationCap, Users } from 'lucide-react';

interface CourseStatsProps {
  studentCount?: number;
  teacherCount?: number;
}

export function CourseStats({ studentCount = 0, teacherCount = 0 }: CourseStatsProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase mb-2">Estadísticas</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <GraduationCap className="h-5 w-5 text-blue-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-600">{studentCount}</p>
          <p className="text-xs text-blue-600">Estudiantes</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <Users className="h-5 w-5 text-purple-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-purple-600">{teacherCount}</p>
          <p className="text-xs text-purple-600">Profesores</p>
        </div>
      </div>
    </div>
  );
}
