import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gradesApi } from '@/shared/api';

export interface UserSearchResult {
  id: number;
  email: string;
  displayName: string | null;
  moodleUserId: number | null;
}

export interface GradeItem {
  itemMoodleId: number;
  itemName: string;
  grade: number | null;
  gradeMax: number | null;
}

export interface Course {
  courseMoodleId: number;
  courseName: string;
  courseShortname: string;
  totalGrade: number | null;
  comment: string | null;
  gradeItems: GradeItem[];
  sumGrade: number;
  sumMax: number;
}

export interface Period {
  periodId: number | null;
  periodName: string;
  periodCode: string;
  courses: Course[];
}

export interface UserGradesData {
  user: {
    id: number;
    email: string;
    displayName: string | null;
    moodleUserId: number | null;
  };
  periods: Period[];
}

export function useGradesSummary() {
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
    queryKey: ['search-users-grades-summary', debouncedQuery],
    queryFn: () => gradesApi.searchUsersForGrades(debouncedQuery, 10),
    enabled: debouncedQuery.length >= 2,
  });

  const { data: userData, isLoading: gradesLoading } = useQuery<UserGradesData>({
    queryKey: ['user-all-grades-summary', selectedUserId],
    queryFn: () => gradesApi.getAllGradesForUser(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const stats = useMemo(() => {
    if (!userData?.periods) return { totalCourses: 0, gradedCourses: 0, avgGrade: null };

    let totalCourses = 0;
    let gradedCourses = 0;
    let totalGradeSum = 0;

    for (const period of userData.periods) {
      for (const course of period.courses) {
        totalCourses++;
        if (course.totalGrade !== null) {
          gradedCourses++;
          totalGradeSum += course.totalGrade;
        }
      }
    }

    const avgGrade = gradedCourses > 0 ? totalGradeSum / gradedCourses : null;
    return { totalCourses, gradedCourses, avgGrade };
  }, [userData?.periods]);

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUserId(user.id);
    setSearchQuery(user.displayName || user.email);
    setShowDropdown(false);
  };

  const getGradeColor = (grade: number | null, max: number | null = 10) => {
    if (grade === null) return 'text-gray-400';
    if (max === 10) {
      if (grade < 5) return 'text-[#F89090] font-semibold';
      if (grade < 7) return 'text-[#FEC04B] font-semibold';
      if (grade < 8) return 'text-[#FEE54B] font-semibold';
      if (grade < 9) return 'text-[#C9E04A] font-semibold';
      if (grade <= 10) return 'text-[#1AC866] font-semibold';
      return 'text-gray-600 font-semibold';
    }
    const percentage = max && max > 0 ? (grade / max) * 100 : grade;
    if (percentage >= 90) return 'text-green-600 font-semibold';
    if (percentage >= 70) return 'text-blue-600 font-semibold';
    if (percentage >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const formatGrade = (grade: number | null, max: number | null) => {
    if (grade === null) return '-';
    if (max !== null && max > 0) {
      return `${grade}/${max}`;
    }
    return String(grade);
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
    stats,
    handleSelectUser,
    getGradeColor,
    formatGrade,
  };
}
