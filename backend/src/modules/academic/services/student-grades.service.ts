import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { CourseStudentGrade } from '../entities/course-student-grade.entity';
import { PeriodAvailableCourse } from '../entities/period-available-course.entity';
import { MoodleCourse } from '../../moodle-integration/entities/moodle-course.entity';
import { MoodleEnrolment } from '../../moodle-integration/entities/moodle-enrolment.entity';
import { MoodleGrade } from '../../moodle-integration/entities/moodle-grade.entity';
import { MoodleGradeItem } from '../../moodle-integration/entities/moodle-grade-item.entity';
import { User } from '../../users/entities/user.entity';
import { AuditService } from '../../sync/services/audit.service';
import { UpdateStudentGradeDto } from '../dto/student-grade.dto';

export interface StudentGradeWithDetails {
  id: number;
  courseMoodleId: number;
  courseName: string | null;
  courseShortname: string | null;
  studentId: number;
  studentName: string;
  studentEmail: string;
  periodId: number;
  moodleSumGrade: number | null;
  moodleSumMax: number | null;
  totalGrade: number | null;
  comment: string | null;
  updatedAt: Date;
}

export interface StudentCourseGrade {
  courseMoodleId: number;
  courseName: string;
  courseShortname: string;
  periodId: number;
  periodName: string;
  totalGrade: number | null;
  comment: string | null;
  teacherName: string | null;
}

@Injectable()
export class StudentGradesService {
  private readonly logger = new Logger(StudentGradesService.name);

  constructor(
    @InjectRepository(CourseStudentGrade)
    private readonly gradeRepository: Repository<CourseStudentGrade>,
    @InjectRepository(MoodleCourse)
    private readonly courseRepository: Repository<MoodleCourse>,
    @InjectRepository(MoodleEnrolment)
    private readonly enrolmentRepository: Repository<MoodleEnrolment>,
    @InjectRepository(MoodleGrade)
    private readonly moodleGradeRepository: Repository<MoodleGrade>,
    @InjectRepository(MoodleGradeItem)
    private readonly gradeItemRepository: Repository<MoodleGradeItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PeriodAvailableCourse)
    private readonly periodCourseRepository: Repository<PeriodAvailableCourse>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get all student grades for a course (for teacher/admin)
   */
  async getGradesByCourse(
    courseMoodleId: number,
    periodId: number,
  ): Promise<StudentGradeWithDetails[]> {
    // Get course info
    const course = await this.courseRepository.findOne({
      where: { moodleId: courseMoodleId },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with Moodle ID ${courseMoodleId} not found`,
      );
    }

    // Get students enrolled in the course
    const enrolments = await this.enrolmentRepository.find({
      where: {
        courseMoodleId,
        roleCode: 'student',
        enrolStatus: 'active',
      },
    });

    if (enrolments.length === 0) {
      return [];
    }

    // Get users (students)
    const studentMoodleIds = enrolments.map((e) => e.userMoodleId);
    const students = await this.userRepository
      .createQueryBuilder('user')
      .where('user.moodleUserId IN (:...ids)', { ids: studentMoodleIds })
      .getMany();

    const studentMap = new Map(students.map((s) => [s.moodleUserId, s]));

    // Get existing grades from our table
    const existingGrades = await this.gradeRepository.find({
      where: {
        courseMoodleId,
        periodId,
      },
    });

    const gradeMap = new Map(existingGrades.map((g) => [g.studentId, g]));

    // Calculate Moodle sum for each student
    const moodleSums = await this.calculateMoodleSums(
      courseMoodleId,
      studentMoodleIds,
    );

    // Build result
    const results: StudentGradeWithDetails[] = [];

    for (const enrolment of enrolments) {
      const student = studentMap.get(enrolment.userMoodleId);
      if (!student) continue;

      const existingGrade = gradeMap.get(student.id);
      const moodleSum = moodleSums.get(enrolment.userMoodleId);

      results.push({
        id: existingGrade?.id ?? 0,
        courseMoodleId,
        courseName: course.subjectName || course.fullname,
        courseShortname: course.shortname,
        studentId: student.id,
        studentName: student.displayName || `${student.email}`,
        studentEmail: student.email,
        periodId,
        moodleSumGrade: moodleSum?.sum ?? null,
        moodleSumMax: moodleSum?.max ?? null,
        totalGrade: existingGrade?.totalGrade ?? null,
        comment: existingGrade?.comment ?? null,
        updatedAt: existingGrade?.updatedAt ?? new Date(),
      });
    }

    return results.sort((a, b) => a.studentName.localeCompare(b.studentName));
  }

  /**
   * Calculate Moodle grade sums for students
   * Note: decimal fields from TypeORM come as strings, must parse to numbers
   * Excludes itemtype='course' as that is the total, not an individual grade
   */
  private async calculateMoodleSums(
    courseMoodleId: number,
    studentMoodleIds: number[],
  ): Promise<Map<number, { sum: number; max: number }>> {
    const result = new Map<number, { sum: number; max: number }>();

    // Get grade items for the course, excluding 'course' type (that's the total)
    const gradeItems = await this.gradeItemRepository.find({
      where: { courseMoodleId, itemtype: Not('course') },
    });

    if (gradeItems.length === 0) {
      return result;
    }

    const itemMoodleIds = gradeItems.map((gi) => gi.itemMoodleId);
    // Parse grademax as float since decimal comes as string from TypeORM
    const totalMax = gradeItems.reduce(
      (sum, gi) => sum + parseFloat(String(gi.grademax || 0)),
      0,
    );

    // Get grades for all students
    for (const studentMoodleId of studentMoodleIds) {
      const grades = await this.moodleGradeRepository.find({
        where: {
          courseMoodleId,
          userMoodleId: studentMoodleId,
          itemMoodleId: In(itemMoodleIds),
        },
      });

      // Parse grade as float since decimal comes as string from TypeORM
      const sum = grades.reduce(
        (total, g) => total + parseFloat(String(g.grade || 0)),
        0,
      );
      result.set(studentMoodleId, { sum, max: totalMax });
    }

    return result;
  }

  /**
   * Update or create a student grade (for teacher)
   * Teachers CANNOT re-edit once a totalGrade has been saved.
   * Admins CAN always edit.
   */
  async updateGrade(
    courseMoodleId: number,
    studentId: number,
    periodId: number,
    dto: UpdateStudentGradeDto,
    teacherId: number,
    isAdmin: boolean = false,
  ): Promise<CourseStudentGrade> {
    // Get course info
    const course = await this.courseRepository.findOne({
      where: { moodleId: courseMoodleId },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with Moodle ID ${courseMoodleId} not found`,
      );
    }

    // Check if student exists
    const student = await this.userRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // Find existing grade or create new
    let grade = await this.gradeRepository.findOne({
      where: {
        courseMoodleId,
        studentId,
        periodId,
      },
    });

    // GRADE LOCKING: If grade already has a totalGrade and caller is NOT admin, block
    if (!isAdmin && grade && grade.totalGrade !== null) {
      throw new ForbiddenException(
        'La calificación ya fue registrada y no puede ser modificada. Contacte al administrador.',
      );
    }

    const isNew = !grade;
    const beforeData = grade ? { ...grade } : null;

    if (!grade) {
      grade = this.gradeRepository.create({
        courseMoodleId,
        studentId,
        periodId,
        teacherId,
        courseName: course.subjectName || course.fullname,
        courseShortname: course.shortname,
      });
    }

    // Update fields
    if (dto.totalGrade !== undefined) {
      grade.totalGrade = dto.totalGrade;
    }
    if (dto.comment !== undefined) {
      grade.comment = dto.comment;
    }
    grade.teacherId = teacherId;

    const saved = await this.gradeRepository.save(grade);

    // Audit
    await this.auditService.log({
      actorUserId: teacherId,
      action: isNew ? 'student_grade.created' : 'student_grade.updated',
      entity: 'course_student_grades',
      entityKey: `${courseMoodleId}:${studentId}:${periodId}`,
      beforeData,
      afterData: saved,
      source: 'app',
    });

    return saved;
  }

  /**
   * Get student's own grades (for student dashboard)
   * Shows ALL enrolled courses for the selected period,
   * with totalGrade/comment from course_student_grades if they exist.
   * If no manual grade has been entered yet, totalGrade and comment are null.
   */
  async getMyGrades(
    studentId: number,
    periodId?: number,
    courseMoodleId?: number,
  ): Promise<StudentCourseGrade[]> {
    // Get the student's moodleUserId
    const user = await this.userRepository.findOne({
      where: { id: studentId },
    });

    if (!user?.moodleUserId) {
      return [];
    }

    // Get all enrollments for this student
    const enrolments = await this.enrolmentRepository.find({
      where: {
        userMoodleId: user.moodleUserId,
        roleCode: 'student',
        enrolStatus: 'active',
      },
    });

    if (enrolments.length === 0) {
      return [];
    }

    let enrolledCourseIds = enrolments.map((e) => e.courseMoodleId);

    // If periodId is provided, filter to only courses available in that period
    let periodName = '';
    if (periodId) {
      const periodCourses = await this.periodCourseRepository.find({
        where: {
          periodId,
          courseMoodleId: In(enrolledCourseIds),
        },
        relations: ['period'],
      });
      enrolledCourseIds = periodCourses.map((pc) => pc.courseMoodleId);
      periodName = periodCourses[0]?.period?.name || '';
    }

    if (enrolledCourseIds.length === 0) {
      return [];
    }

    // If courseMoodleId filter is provided
    if (courseMoodleId) {
      enrolledCourseIds = enrolledCourseIds.filter(
        (id) => id === courseMoodleId,
      );
      if (enrolledCourseIds.length === 0) {
        return [];
      }
    }

    // Get course info
    const courses = await this.courseRepository.find({
      where: { moodleId: In(enrolledCourseIds) },
    });
    const courseMap = new Map(courses.map((c) => [c.moodleId, c]));

    // Get existing manual grades for this student (if any)
    const gradeWhere: any = {
      studentId,
      courseMoodleId: In(enrolledCourseIds),
    };
    if (periodId) {
      gradeWhere.periodId = periodId;
    }

    const existingGrades = await this.gradeRepository.find({
      where: gradeWhere,
      relations: ['period', 'teacher'],
    });

    const gradeMap = new Map(existingGrades.map((g) => [g.courseMoodleId, g]));

    // Build results: one entry per enrolled course
    const results: StudentCourseGrade[] = [];

    for (const courseId of [...new Set(enrolledCourseIds)]) {
      const course = courseMap.get(courseId);
      const grade = gradeMap.get(courseId);

      results.push({
        courseMoodleId: courseId,
        courseName:
          course?.subjectName ||
          course?.fullname ||
          grade?.courseName ||
          `Curso ${courseId}`,
        courseShortname: course?.shortname || grade?.courseShortname || '',
        periodId: periodId || grade?.periodId || 0,
        periodName: grade?.period?.name || periodName || '',
        totalGrade: grade?.totalGrade ?? null,
        comment: grade?.comment ?? null,
        teacherName: grade?.teacher?.displayName || null,
      });
    }

    // Sort by course name
    return results.sort((a, b) => a.courseName.localeCompare(b.courseName));
  }

  /**
   * Get the list of courses where a student is enrolled (for filter dropdown)
   * Now uses moodle_enrolments instead of course_student_grades
   */
  async getMyEnrolledCourses(
    studentId: number,
    periodId?: number,
  ): Promise<
    { courseMoodleId: number; courseName: string; courseShortname: string }[]
  > {
    // Get the user's moodleUserId
    const user = await this.userRepository.findOne({
      where: { id: studentId },
    });

    if (!user?.moodleUserId) {
      return [];
    }

    // Get all enrollments for this user
    const enrolments = await this.enrolmentRepository.find({
      where: {
        userMoodleId: user.moodleUserId,
        roleCode: 'student',
        enrolStatus: 'active',
      },
    });

    if (enrolments.length === 0) {
      return [];
    }

    const courseMoodleIds = enrolments.map((e) => e.courseMoodleId);

    // If periodId filter is provided, only get courses available in that period
    let filteredCourseIds = courseMoodleIds;
    if (periodId) {
      const periodCourses = await this.periodCourseRepository.find({
        where: {
          periodId,
          courseMoodleId: In(courseMoodleIds),
        },
      });
      filteredCourseIds = periodCourses.map((pc) => pc.courseMoodleId);
    }

    if (filteredCourseIds.length === 0) {
      return [];
    }

    // Get course info
    const courses = await this.courseRepository.find({
      where: { moodleId: In(filteredCourseIds) },
    });

    return courses.map((c) => ({
      courseMoodleId: c.moodleId,
      courseName: c.subjectName || c.fullname,
      courseShortname: c.shortname,
    }));
  }

  /**
   * Get list of periods where a student has enrolled courses (for filter dropdown)
   * Now uses moodle_enrolments + period_available_courses
   */
  async getMyPeriodsWithGrades(
    studentId: number,
  ): Promise<{ periodId: number; periodCode: string; periodName: string }[]> {
    // Get the user's moodleUserId
    const user = await this.userRepository.findOne({
      where: { id: studentId },
    });

    if (!user?.moodleUserId) {
      return [];
    }

    // Get all enrollments for this user
    const enrolments = await this.enrolmentRepository.find({
      where: {
        userMoodleId: user.moodleUserId,
        roleCode: 'student',
        enrolStatus: 'active',
      },
    });

    if (enrolments.length === 0) {
      return [];
    }

    const courseMoodleIds = enrolments.map((e) => e.courseMoodleId);

    // Get periods that have these courses available
    const periodCourses = await this.periodCourseRepository.find({
      where: {
        courseMoodleId: In(courseMoodleIds),
      },
      relations: ['period'],
    });

    // Get unique periods
    const uniquePeriods = new Map<
      number,
      { periodId: number; periodCode: string; periodName: string }
    >();
    for (const pc of periodCourses) {
      if (pc.period && !uniquePeriods.has(pc.periodId)) {
        uniquePeriods.set(pc.periodId, {
          periodId: pc.periodId,
          periodCode: pc.period.code,
          periodName: pc.period.name,
        });
      }
    }

    return Array.from(uniquePeriods.values());
  }

  /**
   * Get student's grades for a specific period
   */
  async getMyGradesByPeriod(
    studentId: number,
    periodId: number,
  ): Promise<StudentCourseGrade[]> {
    const grades = await this.gradeRepository.find({
      where: { studentId, periodId },
      relations: ['period', 'teacher'],
    });

    return grades.map((g) => ({
      courseMoodleId: g.courseMoodleId,
      courseName: g.courseName || 'Curso',
      courseShortname: g.courseShortname || '',
      periodId: g.periodId,
      periodName: g.period?.name || '',
      totalGrade: g.totalGrade,
      comment: g.comment,
      teacherName: g.teacher?.displayName || null,
    }));
  }

  /**
   * Batch update grades (for admin to sync Moodle sums)
   */
  async syncMoodleSums(
    courseMoodleId: number,
    periodId: number,
    teacherId: number,
  ): Promise<{ updated: number }> {
    const course = await this.courseRepository.findOne({
      where: { moodleId: courseMoodleId },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with Moodle ID ${courseMoodleId} not found`,
      );
    }

    const enrolments = await this.enrolmentRepository.find({
      where: {
        courseMoodleId,
        roleCode: 'student',
        enrolStatus: 'active',
      },
    });

    const studentMoodleIds = enrolments.map((e) => e.userMoodleId);
    const moodleSums = await this.calculateMoodleSums(
      courseMoodleId,
      studentMoodleIds,
    );

    // Get students
    const students = await this.userRepository
      .createQueryBuilder('user')
      .where('user.moodleUserId IN (:...ids)', { ids: studentMoodleIds })
      .getMany();

    const studentMap = new Map(students.map((s) => [s.moodleUserId, s]));

    let updated = 0;

    for (const enrolment of enrolments) {
      const student = studentMap.get(enrolment.userMoodleId);
      if (!student) continue;

      const moodleSum = moodleSums.get(enrolment.userMoodleId);
      if (!moodleSum) continue;

      let grade = await this.gradeRepository.findOne({
        where: {
          courseMoodleId,
          studentId: student.id,
          periodId,
        },
      });

      if (!grade) {
        grade = this.gradeRepository.create({
          courseMoodleId,
          studentId: student.id,
          periodId,
          teacherId,
          courseName: course.subjectName || course.fullname,
          courseShortname: course.shortname,
        });
      }

      grade.moodleSumGrade = moodleSum.sum;
      grade.moodleSumMax = moodleSum.max;

      await this.gradeRepository.save(grade);
      updated++;
    }

    return { updated };
  }

  // =====================
  // ADMIN: Grades by Period
  // =====================

  /**
   * Get all courses with grades for a period (Admin view)
   * Returns summary of each course with enrolled student count
   * Now queries period_available_courses + moodle_enrolments
   */
  async getCoursesWithGradesForPeriod(periodId: number): Promise<
    {
      courseMoodleId: number;
      courseName: string;
      courseShortname: string;
      studentCount: number;
      gradedCount: number;
    }[]
  > {
    // Get available courses for this period
    const availableCourses = await this.periodCourseRepository.find({
      where: { periodId, enabled: true },
    });

    if (availableCourses.length === 0) {
      return [];
    }

    const results: {
      courseMoodleId: number;
      courseName: string;
      courseShortname: string;
      studentCount: number;
      gradedCount: number;
    }[] = [];

    for (const ac of availableCourses) {
      // Count enrolled students in this course
      const studentCount = await this.enrolmentRepository.count({
        where: {
          courseMoodleId: ac.courseMoodleId,
          roleCode: 'student',
          enrolStatus: 'active',
        },
      });

      // Count students with grades entered for this period/course
      const gradedCount = await this.gradeRepository.count({
        where: {
          courseMoodleId: ac.courseMoodleId,
          periodId,
          totalGrade: Not(IsNull()),
        },
      });

      // Always lookup course name from moodle_courses to get subjectName
      let courseName = '';
      let courseShortname = ac.courseShortname || '';

      const course = await this.courseRepository.findOne({
        where: { moodleId: ac.courseMoodleId },
      });
      if (course) {
        courseName = course.subjectName || course.fullname;
        courseShortname = course.shortname;
      } else {
        courseName = ac.courseName || '';
      }

      results.push({
        courseMoodleId: ac.courseMoodleId,
        courseName: courseName || `Curso ${ac.courseMoodleId}`,
        courseShortname,
        studentCount,
        gradedCount,
      });
    }

    return results.sort((a, b) => a.courseName.localeCompare(b.courseName));
  }

  /**
   * Get all student grades for a specific period and course (Admin view)
   */
  async getGradesForPeriodAndCourse(
    periodId: number,
    courseMoodleId: number,
  ): Promise<StudentGradeWithDetails[]> {
    // Use existing method since it already does what we need
    return this.getGradesByCourse(courseMoodleId, periodId);
  }

  /**
   * Get all grades for a course across all periods (Admin view)
   * Used in CourseDetail to show all students with their grades
   */
  async getCourseGradesAllPeriods(courseMoodleId: number): Promise<
    {
      studentId: number;
      studentName: string;
      studentEmail: string;
      periodId: number | null;
      periodName: string | null;
      moodleSumGrade: number | null;
      moodleSumMax: number | null;
      totalGrade: number | null;
      comment: string | null;
    }[]
  > {
    // Get all grades for this course from any period
    const grades = await this.gradeRepository.find({
      where: { courseMoodleId },
      relations: ['period'],
    });

    if (grades.length === 0) {
      // No manual grades yet, try to get students from enrolments
      const enrolments = await this.enrolmentRepository.find({
        where: {
          courseMoodleId,
          roleCode: 'student',
          enrolStatus: 'active',
        },
      });

      if (enrolments.length === 0) {
        return [];
      }

      // Get student info
      const studentMoodleIds = enrolments.map((e) => e.userMoodleId);
      const students = await this.userRepository
        .createQueryBuilder('user')
        .where('user.moodleUserId IN (:...ids)', { ids: studentMoodleIds })
        .getMany();

      const studentMap = new Map(students.map((s) => [s.moodleUserId, s]));

      // Calculate Moodle sums
      const moodleSums = await this.calculateMoodleSums(
        courseMoodleId,
        studentMoodleIds,
      );

      return enrolments.map((e) => {
        const student = studentMap.get(e.userMoodleId);
        const moodleSum = moodleSums.get(e.userMoodleId);

        return {
          studentId: student?.id ?? 0,
          studentName: student?.displayName || student?.email || 'Unknown',
          studentEmail: student?.email || '',
          periodId: null,
          periodName: null,
          moodleSumGrade: moodleSum?.sum ?? null,
          moodleSumMax: moodleSum?.max ?? null,
          totalGrade: null,
          comment: null,
        };
      });
    }

    // Get student info
    const studentIds = [...new Set(grades.map((g) => g.studentId))];
    const students = await this.userRepository.find({
      where: { id: In(studentIds) },
    });
    const studentMap = new Map(students.map((s) => [s.id, s]));

    return grades.map((g) => {
      const student = studentMap.get(g.studentId);

      return {
        studentId: g.studentId,
        studentName: student?.displayName || student?.email || 'Unknown',
        studentEmail: student?.email || '',
        periodId: g.periodId ?? null,
        periodName: g.period?.name ?? null,
        moodleSumGrade: g.moodleSumGrade ?? null,
        moodleSumMax: g.moodleSumMax ?? null,
        totalGrade: g.totalGrade ?? null,
        comment: g.comment ?? null,
      };
    });
  }

  // =====================
  // ADMIN: Grades by User
  // =====================

  /**
   * Search users by email or name (for admin user search)
   */
  async searchUsers(
    query: string,
    limit: number = 10,
  ): Promise<
    {
      id: number;
      email: string;
      displayName: string | null;
      username: string | null;
      moodleUserId: number | null;
      isActive: boolean;
    }[]
  > {
    if (!query || query.length < 2) {
      return [];
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .where(
        '(LOWER(user.email) LIKE :query OR LOWER(user.displayName) LIKE :query)',
        { query: `%${query.toLowerCase()}%` },
      )
      .select([
        'user.id',
        'user.email',
        'user.displayName',
        'user.username',
        'user.moodleUserId',
        'user.isActive',
      ])
      .take(limit)
      .getMany();

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      username: u.username || null,
      moodleUserId: u.moodleUserId,
      isActive: u.isActive,
    }));
  }

  /**
   * Get all grades for a specific user (Admin view)
   * Shows all courses where the student has grades in course_student_grades
   * Includes detailed Moodle grades for each course
   */
  async getAllGradesForUser(userId: number): Promise<{
    user: {
      id: number;
      email: string;
      displayName: string | null;
      username: string | null;
      moodleUserId: number | null;
    };
    periods: {
      periodId: number | null;
      periodName: string;
      periodCode: string;
      courses: {
        courseMoodleId: number;
        courseName: string;
        courseShortname: string;
        courseCode: string | null;
        courseSubjectName: string | null;
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
      }[];
    }[];
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get all grades for this student directly from course_student_grades
    const studentGrades = await this.gradeRepository.find({
      where: { studentId: userId },
      relations: ['period', 'teacher'],
    });

    if (studentGrades.length === 0) {
      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          username: user.username || null,
          moodleUserId: user.moodleUserId,
        },
        periods: [],
      };
    }

    // Get course info for each grade
    const courseMoodleIds = [
      ...new Set(studentGrades.map((g) => g.courseMoodleId)),
    ];
    const courses = await this.courseRepository.find({
      where: { moodleId: In(courseMoodleIds) },
    });
    const courseMap = new Map(courses.map((c) => [c.moodleId, c]));

    // Get Moodle grade items for all courses (exclude 'course' type which is the total)
    const allGradeItems = await this.gradeItemRepository.find({
      where: { courseMoodleId: In(courseMoodleIds) },
    });
    const gradeItemsByCourse = new Map<number, typeof allGradeItems>();
    for (const item of allGradeItems) {
      if (item.itemtype === 'course') continue; // Skip course totals
      const existing = gradeItemsByCourse.get(item.courseMoodleId) || [];
      existing.push(item);
      gradeItemsByCourse.set(item.courseMoodleId, existing);
    }

    // Get Moodle grades for this user if they have moodleUserId
    const userMoodleGrades = new Map<string, number>();
    if (user.moodleUserId) {
      const moodleGrades = await this.moodleGradeRepository.find({
        where: {
          userMoodleId: user.moodleUserId,
          courseMoodleId: In(courseMoodleIds),
        },
      });
      for (const mg of moodleGrades) {
        userMoodleGrades.set(
          `${mg.courseMoodleId}:${mg.itemMoodleId}`,
          parseFloat(String(mg.grade || 0)),
        );
      }
    }

    // Group grades by period
    const periodMap = new Map<number | null, typeof studentGrades>();
    for (const grade of studentGrades) {
      const periodId = grade.periodId ?? null;
      const existing = periodMap.get(periodId) || [];
      existing.push(grade);
      periodMap.set(periodId, existing);
    }

    // Build results grouped by period
    const periods: {
      periodId: number | null;
      periodName: string;
      periodCode: string;
      courses: {
        courseMoodleId: number;
        courseName: string;
        courseShortname: string;
        courseCode: string | null;
        courseSubjectName: string | null;
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
      }[];
    }[] = [];

    for (const [periodId, grades] of periodMap) {
      const firstGrade = grades[0];
      const periodCourses = grades.map((grade) => {
        const course = courseMap.get(grade.courseMoodleId);
        const courseGradeItems =
          gradeItemsByCourse.get(grade.courseMoodleId) || [];

        // Build grade items with student's grades
        let sumGrade = 0;
        let sumMax = 0;
        const gradeItems = courseGradeItems.map((item) => {
          const gradeValue = userMoodleGrades.get(
            `${grade.courseMoodleId}:${item.itemMoodleId}`,
          );
          const gradeMaxValue = parseFloat(String(item.grademax || 0));

          if (gradeValue !== undefined) {
            sumGrade += gradeValue;
          }
          sumMax += gradeMaxValue;

          return {
            itemMoodleId: item.itemMoodleId,
            itemName: item.itemname || `Item ${item.itemMoodleId}`,
            grade: gradeValue ?? null,
            gradeMax: gradeMaxValue,
          };
        });

        // Sort grade items by name
        gradeItems.sort((a, b) => a.itemName.localeCompare(b.itemName));

        return {
          courseMoodleId: grade.courseMoodleId,
          courseName:
            grade.courseName ||
            course?.subjectName ||
            course?.fullname ||
            `Curso ${grade.courseMoodleId}`,
          courseShortname: grade.courseShortname || course?.shortname || '',
          courseCode: course?.code || null,
          courseSubjectName: course?.subjectName || null,
          totalGrade: grade.totalGrade ?? null,
          comment: grade.comment ?? null,
          gradeItems,
          sumGrade: Math.round(sumGrade * 100) / 100,
          sumMax: Math.round(sumMax * 100) / 100,
        };
      });

      // Sort courses by name
      periodCourses.sort((a, b) => a.courseName.localeCompare(b.courseName));

      periods.push({
        periodId,
        periodName: firstGrade.period?.name ?? 'Sin período',
        periodCode: firstGrade.period?.code ?? '',
        courses: periodCourses,
      });
    }

    // Sort periods (with period first, null last)
    periods.sort((a, b) => {
      if (a.periodId === null && b.periodId !== null) return 1;
      if (a.periodId !== null && b.periodId === null) return -1;
      if (a.periodId !== b.periodId)
        return (b.periodId ?? 0) - (a.periodId ?? 0);
      return 0;
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        username: user.username || null,
        moodleUserId: user.moodleUserId,
      },
      periods,
    };
  }
}
