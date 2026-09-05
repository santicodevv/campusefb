import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi, usersApi, gradesApi } from '@/shared/api';
import toast from 'react-hot-toast';
import type { EnrolledUserWithDetails } from '@/shared/types';
import type { CourseGradeData } from '@/modules/admin/types/course.types';
import type { UsersResponseData } from '@/modules/admin/types/user.types';

export function getAccessStatus(lastAccess: string | null): { color: string; bgColor: string; label: string } {
  if (!lastAccess) {
    return { color: 'bg-gray-400', bgColor: 'bg-gray-100', label: 'Nunca' };
  }

  const lastAccessDate = new Date(lastAccess);
  const now = new Date();
  const diffTime = now.getTime() - lastAccessDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 20) {
    return { color: 'bg-red-500', bgColor: 'bg-red-50', label: 'Inactivo' };
  } else if (diffDays >= 15) {
    return { color: 'bg-yellow-500', bgColor: 'bg-yellow-50', label: 'Advertencia' };
  } else {
    return { color: 'bg-green-500', bgColor: 'bg-green-50', label: 'Activo' };
  }
}

export function useCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher'>('all');
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'grades'>('users');
  const [gradesSearch, setGradesSearch] = useState('');

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: () => coursesApi.getByMoodleId(Number(courseId)),
    enabled: !!courseId,
  });

  const { data: enrolledUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['enrolled-users', courseId],
    queryFn: () => coursesApi.getEnrolledUsersWithDetails(Number(courseId)),
    enabled: !!courseId,
  });

  const { data: assignedTeachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['course-teachers', course?.moodleId],
    queryFn: () => coursesApi.getTeachersForCourse(course!.moodleId),
    enabled: !!course?.moodleId,
  });

  const { data: allTeachers } = useQuery({
    queryKey: ['all-teachers'],
    queryFn: () => usersApi.getAll({ limit: 1000 }),
    enabled: showAddTeacherModal,
  });

  const { data: courseGrades, isLoading: gradesLoading } = useQuery({
    queryKey: ['course-all-grades', course?.moodleId],
    queryFn: () => gradesApi.getCourseGradesAllPeriods(course!.moodleId),
    enabled: !!course?.moodleId && activeTab === 'grades',
  });

  const allTeachersData = allTeachers as unknown as UsersResponseData | undefined;

  const availableTeachers = allTeachersData?.users?.filter((user) => {
    const hasTeacherRole = user.roles?.some((r) => r.code === 'TEACHER');
    if (!hasTeacherRole) return false;

    const isAssigned = assignedTeachers?.some((at) => at.teacherId === user.id);
    if (isAssigned) return false;

    if (teacherSearch) {
      const searchLower = teacherSearch.toLowerCase();
      return (
        user.displayName?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  const assignTeacherMutation = useMutation<unknown, Error, number>({
    mutationFn: (teacherId) =>
      coursesApi.assignTeachers(course!.moodleId, [teacherId], course!.fullname),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-teachers', course?.moodleId] });
      toast.success('Profesor asignado correctamente');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Error al asignar profesor');
    },
  });

  const removeTeacherMutation = useMutation<unknown, Error, number>({
    mutationFn: (teacherId) => coursesApi.removeTeacher(course!.moodleId, teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-teachers', course?.moodleId] });
      toast.success('Profesor removido correctamente');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Error al remover profesor');
    },
  });

  const setPrimaryMutation = useMutation<unknown, Error, number>({
    mutationFn: (teacherId) => coursesApi.setPrimaryTeacher(course!.moodleId, teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-teachers', course?.moodleId] });
      toast.success('Profesor principal actualizado');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Error al actualizar');
    },
  });

  const filteredUsers = enrolledUsers?.filter((user: EnrolledUserWithDetails) => {
    const matchesSearch =
      !search ||
      user.firstname.toLowerCase().includes(search.toLowerCase()) ||
      user.lastname.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'student' && user.roleCode === 'student') ||
      (roleFilter === 'teacher' && user.roleCode.toLowerCase().includes('teacher'));

    return matchesSearch && matchesRole;
  });

  const students = enrolledUsers?.filter((u: EnrolledUserWithDetails) => u.roleCode === 'student') || [];
  const teachers = enrolledUsers?.filter((u: EnrolledUserWithDetails) => u.roleCode.toLowerCase().includes('teacher')) || [];

  return {
    navigate,
    courseId,
    course,
    courseLoading,
    enrolledUsers,
    usersLoading,
    assignedTeachers,
    teachersLoading,
    courseGrades: courseGrades as unknown as CourseGradeData[] | undefined,
    gradesLoading,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    showAddTeacherModal,
    setShowAddTeacherModal,
    teacherSearch,
    setTeacherSearch,
    activeTab,
    setActiveTab,
    gradesSearch,
    setGradesSearch,
    availableTeachers,
    assignTeacherMutation,
    removeTeacherMutation,
    setPrimaryMutation,
    filteredUsers,
    students,
    teachers,
  };
}
