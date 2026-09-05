import { useStudentCourses } from '../hooks/useStudentCourses';
import { StudentCoursesHeader } from '../components/courses/StudentCoursesHeader';
import { StudentCoursesStats } from '../components/courses/StudentCoursesStats';
import { StudentCoursesList } from '../components/courses/StudentCoursesList';
import { StudentCoursesEmpty } from '../components/courses/StudentCoursesEmpty';
import { StudentCoursesError } from '../components/courses/StudentCoursesError';
import { Spinner } from '@/shared/components/ui';

export default function StudentCourses() {
  const { courses, isLoading, error, getMoodleCourseUrl, formatDate } = useStudentCourses();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <StudentCoursesError error={error as { response?: { data?: { message?: string } } } | null} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <StudentCoursesHeader />
      <StudentCoursesStats courses={courses} />

      {courses && courses.length > 0 ? (
        <StudentCoursesList
          courses={courses}
          getMoodleCourseUrl={getMoodleCourseUrl}
          formatDate={formatDate}
        />
      ) : (
        <StudentCoursesEmpty />
      )}
    </div>
  );
}
