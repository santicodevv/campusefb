import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocalGrade } from '../../academic/entities/local-grade.entity';
import {
  AcademicPeriod,
  AcademicPeriodStatus,
} from '../../academic/entities/academic-period.entity';
import { PeriodAvailableCourse } from '../../academic/entities/period-available-course.entity';
import { MoodleCourse } from '../../moodle-integration/entities/moodle-course.entity';
import { MoodleEnrolment } from '../../moodle-integration/entities/moodle-enrolment.entity';
import { MoodleUser } from '../../moodle-integration/entities/moodle-user.entity';
import { User } from '../../users/entities/user.entity';
import {
  StudentGradesFilterDto,
  CourseGradesFilterDto,
  PeriodReportFilterDto,
  GlobalSummaryFilterDto,
} from '../dto/report-filters.dto';
import {
  StudentGradesReportDto,
  StudentGradeReportItem,
  CourseGradesReportDto,
  CourseStudentGradeItem,
  PeriodReportDto,
  PeriodCourseStats,
  GlobalSummaryDto,
} from '../dto/report-responses.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(LocalGrade)
    private readonly gradeRepository: Repository<LocalGrade>,
    @InjectRepository(AcademicPeriod)
    private readonly periodRepository: Repository<AcademicPeriod>,
    @InjectRepository(MoodleCourse)
    private readonly courseRepository: Repository<MoodleCourse>,
    @InjectRepository(MoodleEnrolment)
    private readonly enrolmentRepository: Repository<MoodleEnrolment>,
    @InjectRepository(MoodleUser)
    private readonly moodleUserRepository: Repository<MoodleUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PeriodAvailableCourse)
    private readonly availableCourseRepository: Repository<PeriodAvailableCourse>,
  ) {}

  /**
   * Reporte de calificaciones por estudiante
   */
  async getStudentGradesReport(
    studentId: number,
    filters: StudentGradesFilterDto,
  ): Promise<StudentGradesReportDto> {
    const student = await this.userRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const query = this.gradeRepository
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.course', 'course')
      .leftJoinAndSelect('grade.gradeItem', 'gradeItem')
      .leftJoinAndSelect('grade.teacher', 'teacher')
      .leftJoinAndSelect('grade.period', 'period')
      .where('grade.studentId = :studentId', { studentId });

    if (filters.periodId) {
      query.andWhere('grade.periodId = :periodId', {
        periodId: filters.periodId,
      });
    }

    if (filters.courseId) {
      query.andWhere('grade.courseId = :courseId', {
        courseId: filters.courseId,
      });
    }

    query
      .orderBy('period.startDate', 'DESC')
      .addOrderBy('course.fullname', 'ASC');

    const grades = await query.getMany();

    const gradeItems: StudentGradeReportItem[] = grades.map((g) => ({
      courseId: g.courseId,
      courseName: g.course.fullname,
      gradeItemId: g.gradeItemId,
      gradeItemName: g.gradeItem.itemname,
      grade: Number(g.grade),
      gradeMax: g.gradeItem.grademax || 100,
      gradeMin: g.gradeItem.grademin || 0,
      percentage: this.calculatePercentage(
        Number(g.grade),
        g.gradeItem.grademin || 0,
        g.gradeItem.grademax || 100,
      ),
      feedback: g.feedback,
      teacherName: g.teacher.displayName || g.teacher.email,
      periodCode: g.period.code,
      syncedToMoodle: g.syncedToMoodle,
      createdAt: g.createdAt,
    }));

    const uniqueCourses = new Set(gradeItems.map((g) => g.courseId));
    const avgPercentage =
      gradeItems.length > 0
        ? gradeItems.reduce((acc, g) => acc + g.percentage, 0) /
          gradeItems.length
        : 0;

    let period: AcademicPeriod | null = null;
    if (filters.periodId) {
      period = await this.periodRepository.findOne({
        where: { id: filters.periodId },
      });
    }

    return {
      studentId,
      studentEmail: student.email,
      studentName: student.displayName || student.email,
      periodId: filters.periodId,
      periodCode: period?.code,
      grades: gradeItems,
      summary: {
        totalGrades: gradeItems.length,
        averagePercentage: Math.round(avgPercentage * 100) / 100,
        coursesCount: uniqueCourses.size,
      },
    };
  }

  /**
   * Reporte de calificaciones por curso
   */
  async getCourseGradesReport(
    courseId: number,
    filters: CourseGradesFilterDto,
  ): Promise<CourseGradesReportDto> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    const query = this.gradeRepository
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.student', 'student')
      .leftJoinAndSelect('grade.gradeItem', 'gradeItem')
      .leftJoinAndSelect('grade.period', 'period')
      .where('grade.courseId = :courseId', { courseId });

    if (filters.periodId) {
      query.andWhere('grade.periodId = :periodId', {
        periodId: filters.periodId,
      });
    }

    if (filters.gradeItemId) {
      query.andWhere('grade.gradeItemId = :gradeItemId', {
        gradeItemId: filters.gradeItemId,
      });
    }

    query.orderBy('student.email', 'ASC');

    const grades = await query.getMany();

    // Agrupar por estudiante
    const studentMap = new Map<number, CourseStudentGradeItem>();
    const gradeItemsSet = new Map<
      number,
      { id: number; name: string; gradeMax: number; gradeMin: number }
    >();

    for (const g of grades) {
      // Agregar grade item al set
      if (!gradeItemsSet.has(g.gradeItemId)) {
        gradeItemsSet.set(g.gradeItemId, {
          id: g.gradeItemId,
          name: g.gradeItem.itemname,
          gradeMax: g.gradeItem.grademax || 100,
          gradeMin: g.gradeItem.grademin || 0,
        });
      }

      // Agregar o actualizar estudiante
      if (!studentMap.has(g.studentId)) {
        studentMap.set(g.studentId, {
          studentId: g.studentId,
          studentEmail: g.student.email,
          studentName: g.student.displayName || g.student.email,
          grades: [],
          averagePercentage: 0,
        });
      }

      const studentItem = studentMap.get(g.studentId)!;
      studentItem.grades.push({
        gradeItemId: g.gradeItemId,
        gradeItemName: g.gradeItem.itemname,
        grade: Number(g.grade),
        gradeMax: g.gradeItem.grademax || 100,
        percentage: this.calculatePercentage(
          Number(g.grade),
          g.gradeItem.grademin || 0,
          g.gradeItem.grademax || 100,
        ),
        feedback: g.feedback,
      });
    }

    // Calcular promedio por estudiante
    const students = Array.from(studentMap.values()).map((s) => ({
      ...s,
      averagePercentage:
        s.grades.length > 0
          ? Math.round(
              (s.grades.reduce((acc, g) => acc + g.percentage, 0) /
                s.grades.length) *
                100,
            ) / 100
          : 0,
    }));

    // Estadísticas
    const allGrades = grades.map((g) => Number(g.grade));
    const passingGrades = allGrades.filter((g) => g >= 60); // Asumiendo 60 como nota de aprobación

    let period: AcademicPeriod | null = null;
    if (filters.periodId) {
      period = await this.periodRepository.findOne({
        where: { id: filters.periodId },
      });
    }

    return {
      courseId,
      courseName: course.fullname,
      periodId: filters.periodId,
      periodCode: period?.code,
      gradeItems: Array.from(gradeItemsSet.values()),
      students,
      statistics: {
        totalStudents: students.length,
        totalGrades: grades.length,
        averageGrade:
          allGrades.length > 0
            ? Math.round(
                (allGrades.reduce((a, b) => a + b, 0) / allGrades.length) * 100,
              ) / 100
            : 0,
        passRate:
          allGrades.length > 0
            ? Math.round((passingGrades.length / allGrades.length) * 10000) /
              100
            : 0,
        highestGrade: allGrades.length > 0 ? Math.max(...allGrades) : 0,
        lowestGrade: allGrades.length > 0 ? Math.min(...allGrades) : 0,
      },
    };
  }

  /**
   * Reporte por período académico
   */
  async getPeriodReport(
    periodId: number,
    filters: PeriodReportFilterDto,
  ): Promise<PeriodReportDto> {
    const period = await this.periodRepository.findOne({
      where: { id: periodId },
    });

    if (!period) {
      throw new NotFoundException('Período académico no encontrado');
    }

    const query = this.gradeRepository
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.course', 'course')
      .leftJoinAndSelect('grade.student', 'student')
      .where('grade.periodId = :periodId', { periodId });

    if (filters.courseId) {
      query.andWhere('grade.courseId = :courseId', {
        courseId: filters.courseId,
      });
    }

    const grades = await query.getMany();

    // Agrupar por curso
    const courseMap = new Map<
      number,
      PeriodCourseStats & { grades: number[]; students: Set<number> }
    >();

    for (const g of grades) {
      if (!courseMap.has(g.courseId)) {
        courseMap.set(g.courseId, {
          courseId: g.courseId,
          courseName: g.course.fullname,
          totalStudents: 0,
          totalGrades: 0,
          averageGrade: 0,
          passRate: 0,
          grades: [],
          students: new Set(),
        });
      }

      const courseStats = courseMap.get(g.courseId)!;
      courseStats.grades.push(Number(g.grade));
      courseStats.students.add(g.studentId);
    }

    // Calcular estadísticas por curso
    const courses: PeriodCourseStats[] = Array.from(courseMap.values()).map(
      (c) => {
        const passingGrades = c.grades.filter((g) => g >= 60);
        return {
          courseId: c.courseId,
          courseName: c.courseName,
          totalStudents: c.students.size,
          totalGrades: c.grades.length,
          averageGrade:
            c.grades.length > 0
              ? Math.round(
                  (c.grades.reduce((a, b) => a + b, 0) / c.grades.length) * 100,
                ) / 100
              : 0,
          passRate:
            c.grades.length > 0
              ? Math.round((passingGrades.length / c.grades.length) * 10000) /
                100
              : 0,
        };
      },
    );

    // Resumen general
    const allGrades = grades.map((g) => Number(g.grade));
    const allStudents = new Set(grades.map((g) => g.studentId));
    const passingGrades = allGrades.filter((g) => g >= 60);

    return {
      periodId,
      periodCode: period.code,
      periodName: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
      courses,
      summary: {
        totalCourses: courses.length,
        totalStudents: allStudents.size,
        totalGrades: allGrades.length,
        overallAverageGrade:
          allGrades.length > 0
            ? Math.round(
                (allGrades.reduce((a, b) => a + b, 0) / allGrades.length) * 100,
              ) / 100
            : 0,
        overallPassRate:
          allGrades.length > 0
            ? Math.round((passingGrades.length / allGrades.length) * 10000) /
              100
            : 0,
      },
    };
  }

  /**
   * Estadísticas del dashboard administrativo
   */
  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalCourses: number;
    totalEnrolments: number;
    totalGrades: number;
    activePeriod: {
      id: number;
      name: string;
      startDate: Date;
      endDate: Date;
    } | null;
  }> {
    const [totalUsers, totalGrades, activePeriod] = await Promise.all([
      this.userRepository.count(),
      this.gradeRepository.count(),
      this.periodRepository.findOne({
        where: { status: AcademicPeriodStatus.OPEN },
        order: { startDate: 'DESC' },
      }),
    ]);

    let totalCourses = 0;
    let totalEnrolments = 0;

    if (activePeriod) {
      // Obtener los course_moodle_id asignados explícitamente al período activo
      const assignedCourses = await this.availableCourseRepository.find({
        where: { periodId: activePeriod.id, enabled: true },
        select: ['courseMoodleId'],
      });

      if (assignedCourses.length > 0) {
        const moodleIds = assignedCourses.map((c) => Number(c.courseMoodleId));
        totalCourses = moodleIds.length;

        totalEnrolments = await this.enrolmentRepository
          .createQueryBuilder('enrolment')
          .where('enrolment.courseMoodleId IN (:...moodleIds)', { moodleIds })
          .getCount();
      } else {
        // El período existe pero no tiene cursos asignados → fallback global
        const [fallbackCourses, fallbackEnrolments] = await Promise.all([
          this.courseRepository.count(),
          this.enrolmentRepository.count(),
        ]);
        totalCourses = fallbackCourses;
        totalEnrolments = fallbackEnrolments;
      }
    } else {
      // No hay período activo → totales históricos globales
      const [fallbackCourses, fallbackEnrolments] = await Promise.all([
        this.courseRepository.count(),
        this.enrolmentRepository.count(),
      ]);
      totalCourses = fallbackCourses;
      totalEnrolments = fallbackEnrolments;
    }

    return {
      totalUsers,
      totalCourses,
      totalEnrolments,
      totalGrades,
      activePeriod: activePeriod
        ? {
            id: activePeriod.id,
            name: activePeriod.name,
            startDate: activePeriod.startDate,
            endDate: activePeriod.endDate,
          }
        : null,
    };
  }

  /**
   * Resumen global institucional
   */
  async getGlobalSummary(
    filters: GlobalSummaryFilterDto,
  ): Promise<GlobalSummaryDto> {
    const gradeQuery = this.gradeRepository
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.period', 'period')
      .leftJoinAndSelect('grade.course', 'course');

    if (filters.periodId) {
      gradeQuery.andWhere('grade.periodId = :periodId', {
        periodId: filters.periodId,
      });
    }

    if (filters.startDate) {
      gradeQuery.andWhere('period.startDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      gradeQuery.andWhere('period.endDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const grades = await gradeQuery.getMany();

    // Obtener conteos generales
    const totalPeriods = await this.periodRepository.count();
    const totalCourses = await this.courseRepository.count();
    const totalStudents = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'role')
      .where('role.code = :code', { code: 'STUDENT' })
      .getCount();
    const totalTeachers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'role')
      .where('role.code = :code', { code: 'TEACHER' })
      .getCount();

    // Distribución de calificaciones
    const gradeDistribution = this.calculateGradeDistribution(
      grades.map((g) => Number(g.grade)),
    );

    // Comparación por período
    const periodMap = new Map<
      number,
      { periodId: number; periodCode: string; grades: number[] }
    >();
    for (const g of grades) {
      if (!periodMap.has(g.periodId)) {
        periodMap.set(g.periodId, {
          periodId: g.periodId,
          periodCode: g.period.code,
          grades: [],
        });
      }
      periodMap.get(g.periodId)!.grades.push(Number(g.grade));
    }

    const periodComparison = Array.from(periodMap.values()).map((p) => {
      const passingGrades = p.grades.filter((g) => g >= 60);
      return {
        periodId: p.periodId,
        periodCode: p.periodCode,
        averageGrade:
          p.grades.length > 0
            ? Math.round(
                (p.grades.reduce((a, b) => a + b, 0) / p.grades.length) * 100,
              ) / 100
            : 0,
        passRate:
          p.grades.length > 0
            ? Math.round((passingGrades.length / p.grades.length) * 10000) / 100
            : 0,
        totalGrades: p.grades.length,
      };
    });

    // Top cursos
    const courseMap = new Map<
      number,
      { courseId: number; courseName: string; grades: number[] }
    >();
    for (const g of grades) {
      if (!courseMap.has(g.courseId)) {
        courseMap.set(g.courseId, {
          courseId: g.courseId,
          courseName: g.course.fullname,
          grades: [],
        });
      }
      courseMap.get(g.courseId)!.grades.push(Number(g.grade));
    }

    const topPerformingCourses = Array.from(courseMap.values())
      .map((c) => {
        const passingGrades = c.grades.filter((g) => g >= 60);
        return {
          courseId: c.courseId,
          courseName: c.courseName,
          averageGrade:
            c.grades.length > 0
              ? Math.round(
                  (c.grades.reduce((a, b) => a + b, 0) / c.grades.length) * 100,
                ) / 100
              : 0,
          passRate:
            c.grades.length > 0
              ? Math.round((passingGrades.length / c.grades.length) * 10000) /
                100
              : 0,
        };
      })
      .sort((a, b) => b.averageGrade - a.averageGrade)
      .slice(0, 10);

    return {
      generatedAt: new Date(),
      filters: {
        periodId: filters.periodId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
      overview: {
        totalPeriods,
        totalCourses,
        totalStudents,
        totalTeachers,
        totalGrades: grades.length,
      },
      gradeDistribution,
      periodComparison,
      topPerformingCourses,
    };
  }

  /**
   * Obtener estudiantes activos ordenados por último acceso
   * Usa moodle_enrolments para identificar estudiantes por role_code
   */
  async getActiveStudents(limit: number = 10): Promise<
    {
      id: number;
      moodleId: number;
      firstname: string;
      lastname: string;
      email: string;
      lastAccess: Date | null;
    }[]
  > {
    try {
      // Get students from enrolments with last_course_access
      const enrolmentsWithAccess = await this.enrolmentRepository
        .createQueryBuilder('e')
        .select('DISTINCT e.user_moodle_id', 'userMoodleId')
        .addSelect('MAX(e.last_course_access)', 'lastAccess')
        .where('e.role_code = :roleCode', { roleCode: 'student' })
        .andWhere('e.enrol_status = :status', { status: 'active' })
        .andWhere('e.last_course_access IS NOT NULL')
        .groupBy('e.user_moodle_id')
        .orderBy('MAX(e.last_course_access)', 'DESC')
        .limit(limit)
        .getRawMany();

      if (enrolmentsWithAccess.length === 0) {
        return [];
      }

      // Get user details for these students
      const userMoodleIds = enrolmentsWithAccess.map((e) => e.userMoodleId);
      const users = await this.moodleUserRepository
        .createQueryBuilder('u')
        .where('u.moodle_id IN (:...ids)', { ids: userMoodleIds })
        .andWhere('u.suspended = :suspended', { suspended: false })
        .getMany();

      // Create a map for quick lookup
      const userMap = new Map(users.map((u) => [String(u.moodleId), u]));

      // Combine enrolment access data with user details
      return enrolmentsWithAccess
        .map((e) => {
          const user = userMap.get(String(e.userMoodleId));
          if (!user) return null;
          return {
            id: user.id,
            moodleId: Number(user.moodleId),
            firstname: user.firstname || '',
            lastname: user.lastname || '',
            email: user.email || '',
            lastAccess: e.lastAccess ? new Date(e.lastAccess) : null,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);
    } catch (error) {
      // Log error and return empty array
      console.error('Error fetching active students:', error);
      return [];
    }
  }

  /**
   * Helpers
   */
  private calculatePercentage(grade: number, min: number, max: number): number {
    if (max === min) return 100;
    return Math.round(((grade - min) / (max - min)) * 10000) / 100;
  }

  private calculateGradeDistribution(
    grades: number[],
  ): { range: string; count: number; percentage: number }[] {
    const ranges = [
      { range: '0-59 (Reprobado)', min: 0, max: 59 },
      { range: '60-69 (Suficiente)', min: 60, max: 69 },
      { range: '70-79 (Bueno)', min: 70, max: 79 },
      { range: '80-89 (Muy Bueno)', min: 80, max: 89 },
      { range: '90-100 (Excelente)', min: 90, max: 100 },
    ];

    const total = grades.length;
    return ranges.map((r) => {
      const count = grades.filter((g) => g >= r.min && g <= r.max).length;
      return {
        range: r.range,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      };
    });
  }
}
