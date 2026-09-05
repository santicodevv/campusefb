import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers';
import { coursesApi } from '@/modules/admin/api/courses.api';
import { useMemo } from 'react';

export interface TeacherCourse {
  id: number;
  moodleId: number;
  fullname: string;
  subjectName?: string;
  shortname: string;
  studentCount?: number;
}

export function useTeacherDashboard() {
  const { user } = useAuth();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['teacher-courses', user?.id],
    queryFn: () => coursesApi.getCoursesForTeacher(user!.id),
    enabled: !!user?.id,
  });

  const stats = useMemo(() => {
    const totalStudents = courses.reduce(
      (sum: number, c: TeacherCourse) => sum + (c.studentCount || 0),
      0
    );

    return {
      coursesCount: courses.length,
      totalStudents,
    };
  }, [courses]);

  return {
    user,
    courses,
    isLoading,
    stats,
  };
}
