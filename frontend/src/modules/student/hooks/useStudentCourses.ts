import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/shared/api';

export interface CourseWithCounts {
  id: number;
  moodleId: number;
  fullname: string;
  subjectName?: string;
  shortname: string;
  summary?: string;
  visible: boolean;
  startdate?: string;
  enddate?: string;
  studentCount?: number;
  teacherCount?: number;
}

export function useStudentCourses() {
  const {
    data: courses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['student-enrolled-courses'],
    queryFn: () => coursesApi.getEnrolledCourses(),
  });

  const moodleUrl = (import.meta.env.VITE_MOODLE_URL || '').replace(/\/+$/, '');

  const getMoodleCourseUrl = (courseMoodleId: number) =>
    `${moodleUrl}/course/view.php?id=${courseMoodleId}`;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('es', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return {
    courses: courses as CourseWithCounts[] | undefined,
    isLoading,
    error,
    getMoodleCourseUrl,
    formatDate,
  };
}
