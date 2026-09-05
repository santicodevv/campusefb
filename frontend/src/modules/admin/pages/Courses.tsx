
import { useCourses } from '@/modules/admin/hooks/useCourses';
import { CourseFilters } from '../components/courses/CourseFilters';
import { CourseList } from '../components/courses/CourseList';
import { CourseDetails } from '../components/courses/CourseDetails';

export default function AdminCourses() {
  const coursesHook = useCourses();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
        <p className="mt-1 text-gray-600">Cursos sincronizados desde Moodle</p>
      </div>

      <CourseFilters {...coursesHook} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CourseList {...coursesHook} />
        <CourseDetails {...coursesHook} />
      </div>
    </div>
  );
}
