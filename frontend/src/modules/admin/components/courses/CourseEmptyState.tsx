import { BookOpen } from 'lucide-react';

export function CourseEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
      <BookOpen className="h-12 w-12 mb-4 text-gray-300" />
      <p className="text-sm">Selecciona un curso para ver detalles</p>
    </div>
  );
}
