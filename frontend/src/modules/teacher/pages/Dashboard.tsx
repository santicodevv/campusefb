import { useNavigate } from 'react-router-dom';
import { useTeacherDashboard } from '../hooks/useTeacherDashboard';
import { TeacherDashboardHeader } from '../components/dashboard/TeacherDashboardHeader';
import { TeacherDashboardStats } from '../components/dashboard/TeacherDashboardStats';
import { TeacherRecentCourses } from '../components/dashboard/TeacherRecentCourses';
import { TeacherQuickActions } from '../components/dashboard/TeacherQuickActions';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, courses, isLoading, stats } = useTeacherDashboard();

  const handleNavigateCourses = () => navigate('/teacher/courses');
  const handleNavigateGrades = (moodleId: number) => navigate(`/teacher/grades/${moodleId}`);

  return (
    <div>
      <TeacherDashboardHeader displayName={user?.displayName} />
      
      <TeacherDashboardStats isLoading={isLoading} stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeacherRecentCourses
          courses={courses}
          isLoading={isLoading}
          onNavigateCourses={handleNavigateCourses}
          onNavigateGrades={handleNavigateGrades}
        />

        <TeacherQuickActions
          hasCourses={courses.length > 0}
          firstCourseMoodleId={courses[0]?.moodleId}
          onNavigateCourses={handleNavigateCourses}
          onNavigateGrades={handleNavigateGrades}
        />
      </div>
    </div>
  );
}
