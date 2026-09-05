export class StudentGradeReportItem {
  courseId: number;
  courseName: string;
  gradeItemId: number;
  gradeItemName: string;
  grade: number;
  gradeMax: number;
  gradeMin: number;
  percentage: number;
  feedback?: string;
  teacherName: string;
  periodCode: string;
  syncedToMoodle: boolean;
  createdAt: Date;
}

export class StudentGradesReportDto {
  studentId: number;
  studentEmail: string;
  studentName: string;
  periodId?: number;
  periodCode?: string;
  grades: StudentGradeReportItem[];
  summary: {
    totalGrades: number;
    averagePercentage: number;
    coursesCount: number;
  };
}

export class CourseStudentGradeItem {
  studentId: number;
  studentEmail: string;
  studentName: string;
  grades: {
    gradeItemId: number;
    gradeItemName: string;
    grade: number;
    gradeMax: number;
    percentage: number;
    feedback?: string;
  }[];
  averagePercentage: number;
}

export class CourseGradesReportDto {
  courseId: number;
  courseName: string;
  periodId?: number;
  periodCode?: string;
  gradeItems: {
    id: number;
    name: string;
    gradeMax: number;
    gradeMin: number;
  }[];
  students: CourseStudentGradeItem[];
  statistics: {
    totalStudents: number;
    totalGrades: number;
    averageGrade: number;
    passRate: number;
    highestGrade: number;
    lowestGrade: number;
  };
}

export class PeriodCourseStats {
  courseId: number;
  courseName: string;
  totalStudents: number;
  totalGrades: number;
  averageGrade: number;
  passRate: number;
}

export class PeriodReportDto {
  periodId: number;
  periodCode: string;
  periodName: string;
  startDate: Date;
  endDate: Date;
  status: string;
  courses: PeriodCourseStats[];
  summary: {
    totalCourses: number;
    totalStudents: number;
    totalGrades: number;
    overallAverageGrade: number;
    overallPassRate: number;
  };
}

export class GlobalSummaryDto {
  generatedAt: Date;
  filters: {
    periodId?: number;
    startDate?: string;
    endDate?: string;
  };
  overview: {
    totalPeriods: number;
    totalCourses: number;
    totalStudents: number;
    totalTeachers: number;
    totalGrades: number;
  };
  gradeDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  periodComparison: {
    periodId: number;
    periodCode: string;
    averageGrade: number;
    passRate: number;
    totalGrades: number;
  }[];
  topPerformingCourses: {
    courseId: number;
    courseName: string;
    averageGrade: number;
    passRate: number;
  }[];
}
