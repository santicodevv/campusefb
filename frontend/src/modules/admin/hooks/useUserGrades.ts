import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gradesApi } from '@/shared/api';
import type { UserSearchResult, FlattenedCourse } from '@/modules/admin/types/user.types';

export function useUserGrades() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search-users-grades', debouncedQuery],
    queryFn: () => gradesApi.searchUsersForGrades(debouncedQuery, 10),
    enabled: debouncedQuery.length >= 2,
  });

  const { data: userData, isLoading: gradesLoading } = useQuery({
    queryKey: ['user-all-grades', selectedUserId],
    queryFn: () => gradesApi.getAllGradesForUser(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const allCourses: FlattenedCourse[] = useMemo(() => {
    if (!userData?.periods) return [];
    return userData.periods.flatMap((period: { periodId: number | null; periodName: string; periodCode: string; courses: Array<{ courseMoodleId: number; courseName: string; courseShortname: string; totalGrade: number | null; comment: string | null }> }) =>
      period.courses.map((course) => ({
        ...course,
        periodId: period.periodId,
        periodName: period.periodName,
        periodCode: period.periodCode,
      }))
    );
  }, [userData]); // Fixed dependency array for React Compiler

  const stats = useMemo(() => {
    if (allCourses.length === 0)
      return { totalCourses: 0, gradedCourses: 0, avgGrade: null };

    const totalCourses = allCourses.length;
    const gradedCourses = allCourses.filter((c) => c.totalGrade !== null).length;
    const avgGrade =
      gradedCourses > 0
        ? allCourses
            .filter((c) => c.totalGrade !== null)
            .reduce((sum, c) => sum + (c.totalGrade || 0), 0) / gradedCourses
        : null;

    return { totalCourses, gradedCourses, avgGrade };
  }, [allCourses]);

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUserId(user.id);
    setSearchQuery(user.displayName || user.email);
    setShowDropdown(false);
  };

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    selectedUserId,
    setSelectedUserId,
    showDropdown,
    setShowDropdown,
    searchResults,
    searchLoading,
    userData,
    gradesLoading,
    allCourses,
    stats,
    handleSelectUser,
  };
}
