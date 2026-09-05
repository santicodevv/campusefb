import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/shared/components/ui';
import { useTeacherCourses } from '../hooks/useTeacherCourses';
import { TeacherCoursesHeader } from '../components/courses/TeacherCoursesHeader';
import { TeacherEditSessionStatus } from '../components/courses/TeacherEditSessionStatus';
import { TeacherCoursesList } from '../components/courses/TeacherCoursesList';
import { TeacherCoursesEmpty } from '../components/courses/TeacherCoursesEmpty';

export default function TeacherCourses() {
  const navigate = useNavigate();
  const { courses, isLoading, editSessionStatus } = useTeacherCourses();

  const handleNavigate = (courseId: number) => {
    navigate(`/teacher/grades/${courseId}`);
  };

  return (
    <div className="p-6">
      <TeacherCoursesHeader editSessionStatus={editSessionStatus} />
      <TeacherEditSessionStatus editSessionStatus={editSessionStatus} />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : courses && courses.length > 0 ? (
        <TeacherCoursesList courses={courses} onNavigate={handleNavigate} />
      ) : (
        <TeacherCoursesEmpty />
      )}
    </div>
  );
}
