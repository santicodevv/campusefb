import { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gradesApi } from '@/shared/api';

export interface UserSearchResult {
  id: number;
  email: string;
  displayName: string | null;
  username: string | null;
  moodleUserId: number | null;
}

export interface UserGradesData {
  user: {
    id: number;
    email: string;
    displayName: string | null;
    username: string | null;
  };
  periods: Array<{
    periodId: number | null;
    periodName: string;
    periodCode: string;
    courses: Array<{
      courseMoodleId: number;
      courseName: string;
      courseShortname: string;
      courseCode: string | null;
      courseSubjectName: string | null;
      programMoodleId?: number | null;
      programName?: string | null;
      materiaName?: string | null;
      totalGrade: number | null;
      comment: string | null;
      sumGrade: number;
      sumMax: number;
      gradeItems: Array<{
        itemMoodleId: number;
        itemName: string;
        grade: number | null;
        gradeMax: number | null;
      }>;
    }>;
  }>;
}

export interface CourseWithPeriod {
  periodId: number | null;
  periodName: string;
  periodCode: string;
  courseMoodleId: number;
  courseName: string;
  courseShortname: string;
  courseCode: string | null;
  courseSubjectName: string | null;
  programMoodleId?: number | null;
  programName?: string | null;
  materiaName?: string | null;
  totalGrade: number | null;
  comment: string | null;
  gradeItems: {
    itemMoodleId: number;
    itemName: string;
    grade: number | null;
    gradeMax: number | null;
  }[];
  sumGrade: number;
  sumMax: number;
}

export function getEquivalence(grade: number | null): string {
  if (grade === null) return '-';
  if (grade >= 90) return 'A';
  if (grade >= 80) return 'B';
  if (grade >= 70) return 'C';
  if (grade >= 60) return 'D';
  return 'F';
}

export function calculateCumulativeIndex(courses: CourseWithPeriod[]): number {
  const gradedCourses = courses.filter((c) => c.totalGrade !== null && c.totalGrade !== undefined);
  if (gradedCourses.length === 0) return 0;
  const sum = gradedCourses.reduce((acc, c) => {
    const grade = parseFloat(String(c.totalGrade || 0));
    return acc + (isNaN(grade) ? 0 : grade);
  }, 0);
  const avg = sum / gradedCourses.length;
  return isNaN(avg) ? 0 : Math.round(avg * 10) / 10;
}

export function generateDocNumber(): string {
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `EFB - ${seq}`;
}

/**
 * Recorta la clave del curso quitando el sufijo del período, ya que el ciclo
 * se muestra en su propia columna. Ej: "TRCB01_2025-3" -> "TRCB01".
 */
export function formatRecordKey(code: string | null | undefined): string {
  if (!code) return '';
  const idx = code.indexOf('_');
  return idx > 0 ? code.substring(0, idx) : code;
}

export interface ProgramOption {
  moodleId: number;
  name: string;
}

export function useAdminGradeRecord() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);
  const [docNumber] = useState(generateDocNumber());

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search-users-grades', searchQuery],
    queryFn: () => gradesApi.searchUsersForGrades(searchQuery, 10),
    enabled: searchQuery.length >= 2,
  });

  const { data: userGrades, isLoading: gradesLoading } = useQuery({
    queryKey: ['user-all-grades', selectedUserId],
    queryFn: () => gradesApi.getAllGradesForUser(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const allCoursesUnfiltered = useMemo((): CourseWithPeriod[] => {
    if (!userGrades?.periods) return [];
    return userGrades.periods.flatMap((period) =>
      period.courses.map((course) => ({
        ...course,
        periodId: period.periodId,
        periodName: period.periodName,
        periodCode: period.periodCode,
      }))
    );
  }, [userGrades]);

  // Programas (DIPLOMATURA, TECNICATURA, ...) en los que el estudiante tiene cursos
  const programOptions = useMemo((): ProgramOption[] => {
    const map = new Map<number, string>();
    for (const c of allCoursesUnfiltered) {
      if (c.programMoodleId != null && c.programName) {
        map.set(c.programMoodleId, c.programName);
      }
    }
    return [...map.entries()]
      .map(([moodleId, name]) => ({ moodleId, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allCoursesUnfiltered]);

  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);

  const selectedProgram = useMemo(
    () => programOptions.find((p) => p.moodleId === selectedProgramId) ?? null,
    [programOptions, selectedProgramId]
  );

  // Cursos del record: si hay programa seleccionado, solo los de ese programa
  const allCourses = useMemo((): CourseWithPeriod[] => {
    if (selectedProgramId == null) return allCoursesUnfiltered;
    return allCoursesUnfiltered.filter((c) => c.programMoodleId === selectedProgramId);
  }, [allCoursesUnfiltered, selectedProgramId]);

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUserId(user.id);
    setSelectedProgramId(null);
    setShowSearch(false);
    setSearchQuery('');
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        @page { size: letter; margin: 0.75in; }
        * { box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          font-size: 11pt;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .container {
          max-width: 100%;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header img {
          max-width: 280px;
          height: auto;
          margin-bottom: 10px;
        }
        .student-info {
          margin: 15px 0 20px 0;
        }
        .student-info p {
          margin: 4px 0;
          font-size: 11pt;
        }
        .student-info strong {
          font-weight: bold;
        }
        .date-line {
          text-align: right;
          margin-bottom: 15px;
        }
        .title-bar {
          background-color: #0d7377;
          color: white;
          padding: 10px 20px;
          text-align: center;
          font-size: 16pt;
          font-weight: bold;
          font-style: italic;
          margin: 20px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          padding: 8px 10px;
          text-align: left;
          font-weight: bold;
          font-size: 10pt;
        }
        td {
          border: 1px solid #ddd;
          padding: 6px 10px;
          font-size: 10pt;
        }
        td.center, th.center {
          text-align: center;
        }
        .cumulative-bar {
          background-color: #d4a017;
          color: white;
          padding: 8px 20px;
          text-align: center;
          font-size: 12pt;
          font-weight: bold;
          margin: 20px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footer {
          margin-top: 40px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }
        .footer-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .footer-seal img {
          width: 80px;
          height: 80px;
          opacity: 0.8;
          border-radius: 50%;
        }
        .footer-signature {
          text-align: center;
        }
        .footer-signature p {
          margin: 2px 0;
        }
        .footer-signature .name {
          font-weight: bold;
          font-size: 11pt;
        }
        .footer-signature .title {
          font-weight: bold;
          font-size: 10pt;
        }
        .footer-right {
          text-align: right;
        }
        .page-note {
          font-style: italic;
          font-size: 9pt;
          margin-top: 15px;
        }
        .doc-id {
          font-size: 11pt;
          font-weight: bold;
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Record de Notas - ${userGrades?.user?.displayName || userGrades?.user?.email}</title>
          ${styles}
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const today = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return {
    searchQuery,
    setSearchQuery,
    selectedUserId,
    setSelectedUserId,
    showSearch,
    setShowSearch,
    printRef,
    docNumber,
    searchResults,
    searchLoading,
    userGrades,
    gradesLoading,
    allCourses,
    programOptions,
    selectedProgramId,
    setSelectedProgramId,
    selectedProgram,
    handleSelectUser,
    handlePrint,
    today,
  };
}
