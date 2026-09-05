import { BookOpen } from 'lucide-react';

export function StudentCoursesHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <BookOpen className="h-7 w-7 text-blue-600" />
        Mis Cursos
      </h1>
      <p className="mt-1 text-gray-600">
        Cursos en los que actualmente estás inscrito
      </p>
    </div>
  );
}
