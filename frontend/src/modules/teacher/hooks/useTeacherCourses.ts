import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers';
import { coursesApi } from '@/modules/admin/api/courses.api';
import { api } from '@/shared/lib';

export function useTeacherCourses() {
  const { user } = useAuth();

  // Fetch teacher's courses
  const { data: courses, isLoading } = useQuery({
    queryKey: ['teacher-courses', user?.id],
    queryFn: () => coursesApi.getCoursesForTeacher(user!.id),
    enabled: !!user?.id,
  });

  // Fetch edit session status
  const { data: editSessionStatus } = useQuery({
    queryKey: ['edit-session-status'],
    queryFn: async () => {
      const response = await api.get('/grades/edit-session/status');
      return response.data;
    },
  });

  return {
    courses,
    isLoading,
    editSessionStatus,
  };
}
