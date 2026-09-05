import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { MoodleCourse } from '../../moodle-integration/entities/moodle-course.entity';
import { MoodleEnrolment } from '../../moodle-integration/entities/moodle-enrolment.entity';
import { MoodleCategory } from '../../moodle-integration/entities/moodle-category.entity';
import { MoodleUser } from '../../moodle-integration/entities/moodle-user.entity';
import { MoodleClientService } from '../../moodle-integration/moodle-client.service';
import { MoodleSyncService } from '../../moodle-integration/moodle-sync.service';
import { CreateCourseDto } from '../dto/create-course.dto';
import { CourseTeacher } from '../entities/course-teacher.entity';
import { User } from '../../users/entities/user.entity';
import { Role, RoleCode } from '../../users/entities/role.entity';
import { AuditService } from '../../sync/services/audit.service';

export interface CoursesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CourseWithCounts extends MoodleCourse {
  studentCount?: number;
  teacherCount?: number;
}

export interface EnrolledUserWithDetails {
  id: number;
  moodleId: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  roleCode: string;
  enrolStatus: string;
  lastCourseAccess: Date | null;
}

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    @InjectRepository(MoodleCourse)
    private readonly courseRepository: Repository<MoodleCourse>,
    @InjectRepository(MoodleEnrolment)
    private readonly enrolmentRepository: Repository<MoodleEnrolment>,
    @InjectRepository(MoodleCategory)
    private readonly categoryRepository: Repository<MoodleCategory>,
    @InjectRepository(MoodleUser)
    private readonly moodleUserRepository: Repository<MoodleUser>,
    @InjectRepository(CourseTeacher)
    private readonly courseTeacherRepository: Repository<CourseTeacher>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly moodleClient: MoodleClientService,
    private readonly moodleSyncService: MoodleSyncService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get all courses with pagination and searchs
   */
  async findAll(params: CoursesQueryParams) {
    const { page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;

    const whereClause = search
      ? [
          { fullname: ILike(`%${search}%`) },
          { shortname: ILike(`%${search}%`) },
          { subjectName: ILike(`%${search}%`) },
          { code: ILike(`%${search}%`) },
        ]
      : {};

    const [courses, total] = await this.courseRepository.findAndCount({
      where: whereClause,
      order: { visible: 'DESC', fullname: 'ASC' },
      skip,
      take: limit,
    });

    // Get student and teacher counts for each course (batch query)
    const courseMoodleIds = courses.map((c) => c.moodleId);
    const allEnrolments =
      courseMoodleIds.length > 0
        ? await this.enrolmentRepository.find({
            where: {
              courseMoodleId: In(courseMoodleIds),
              enrolStatus: 'active',
            },
          })
        : [];
    const studentCountMap = new Map<number, number>();
    const teacherCountMap = new Map<number, number>();
    for (const e of allEnrolments) {
      const mid = e.courseMoodleId;
      if (e.roleCode === 'student') {
        studentCountMap.set(mid, (studentCountMap.get(mid) || 0) + 1);
      } else if (e.roleCode.toLowerCase().includes('teacher')) {
        teacherCountMap.set(mid, (teacherCountMap.get(mid) || 0) + 1);
      }
    }
    const coursesWithCounts: CourseWithCounts[] = courses.map((course) => ({
      ...course,
      studentCount: studentCountMap.get(course.moodleId) || 0,
      teacherCount: teacherCountMap.get(course.moodleId) || 0,
    }));

    return {
      courses: coursesWithCounts,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single course by ID
   */
  async findOne(id: number) {
    const course = await this.courseRepository.findOne({
      where: { id },
    });

    if (!course) {
      return null;
    }

    // Get counts
    const [studentCount, teacherCount] = await Promise.all([
      this.enrolmentRepository.count({
        where: {
          courseMoodleId: course.moodleId,
          roleCode: 'student',
          enrolStatus: 'active',
        },
      }),
      this.enrolmentRepository.count({
        where: {
          courseMoodleId: course.moodleId,
          roleCode: ILike('%teacher%'),
          enrolStatus: 'active',
        },
      }),
    ]);

    return {
      ...course,
      studentCount,
      teacherCount,
    };
  }

  /**
   * Get course details with enrolled students and teachers
   */
  async getCourseDetails(id: number) {
    const course = await this.findOne(id);
    if (!course) {
      return null;
    }

    const enrolments = await this.enrolmentRepository.find({
      where: {
        courseMoodleId: course.moodleId,
        enrolStatus: 'active',
      },
    });

    const students = enrolments.filter((e) => e.roleCode === 'student');
    const teachers = enrolments.filter((e) =>
      e.roleCode.toLowerCase().includes('teacher'),
    );

    return {
      ...course,
      students,
      teachers,
    };
  }

  /**
   * Get all categories
   */
  async getCategories() {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Sync categories from Moodle
   * Also creates Academic Programs (sga_programs) from the categories
   */
  async syncCategories() {
    this.logger.log('Starting categories sync from Moodle...');
    const result = await this.moodleSyncService.syncCategories();
    this.logger.log(`Categories sync completed: ${JSON.stringify(result)}`);
    return result;
  }

  /**
   * Update the subject name of a course (local only)
   */
  async updateSubjectName(courseId: number, subjectName: string) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    course.subjectName = subjectName;
    await this.courseRepository.save(course);
    return course;
  }

  /**
   * Update the code of a course (local only)
   */
  async updateCode(courseId: number, code: string) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    course.code = code;
    await this.courseRepository.save(course);
    return course;
  }

  /**
   * Create a new course in Moodle and save locally
   */
  async createCourse(data: CreateCourseDto) {
    this.logger.log(`Creating course: ${JSON.stringify(data)}`);

    // Ensure categoryid is a number
    const categoryId = Number(data.categoryid);
    if (isNaN(categoryId) || categoryId <= 0) {
      throw new BadRequestException('Invalid category ID');
    }

    // Verify category exists
    const category = await this.categoryRepository.findOne({
      where: { moodleId: categoryId },
    });

    this.logger.log(
      `Category lookup for moodleId ${data.categoryid}: ${category ? 'found' : 'not found'}`,
    );

    if (!category) {
      throw new BadRequestException(
        `Category with Moodle ID ${categoryId} not found. Please sync categories first.`,
      );
    }

    // Create course in Moodle
    const moodlePayload = {
      fullname: data.fullname,
      shortname: data.shortname,
      categoryid: categoryId,
      idnumber: data.idnumber,
      summary: data.summary,
      visible: data.visible === false ? 0 : 1,
      startdate: data.startdate
        ? Math.floor(new Date(data.startdate).getTime() / 1000)
        : undefined,
      enddate: data.enddate
        ? Math.floor(new Date(data.enddate).getTime() / 1000)
        : undefined,
    };

    this.logger.log(`Sending to Moodle: ${JSON.stringify(moodlePayload)}`);

    let moodleResult;
    try {
      moodleResult = await this.moodleClient.createCourse(moodlePayload);
      this.logger.log(`Moodle response: ${JSON.stringify(moodleResult)}`);

      if (!moodleResult || moodleResult.length === 0) {
        throw new BadRequestException(
          'Failed to create course in Moodle - empty response',
        );
      }
    } catch (error) {
      this.logger.error(`Moodle create course error: ${error.message}`);
      throw new BadRequestException(
        `Error creating course in Moodle: ${error.message}`,
      );
    }

    const createdMoodleCourse = moodleResult[0];

    // Save course locally
    const course = this.courseRepository.create({
      moodleId: createdMoodleCourse.id,
      shortname: data.shortname,
      fullname: data.fullname,
      categoryId: categoryId,
      visible: data.visible !== false,
      lastSyncedAt: new Date(),
    });

    if (data.idnumber) {
      course.idnumber = data.idnumber;
    }
    if (data.summary) {
      course.summary = data.summary;
    }
    if (data.startdate) {
      course.startdate = new Date(data.startdate);
    }
    if (data.enddate) {
      course.enddate = new Date(data.enddate);
    }
    if (data.subjectName) {
      course.subjectName = data.subjectName;
    }
    if (data.code) {
      course.code = data.code;
    }

    await this.courseRepository.save(course);

    return {
      ...course,
      studentCount: 0,
      teacherCount: 0,
    };
  }

  /**
   * Get courses where a user is enrolled
   */
  async getCoursesForUser(userMoodleId: number): Promise<CourseWithCounts[]> {
    // Find all enrollments for this user
    const enrolments = await this.enrolmentRepository.find({
      where: {
        userMoodleId,
        enrolStatus: 'active',
      },
    });

    if (enrolments.length === 0) {
      return [];
    }

    // Get unique course moodle IDs
    const courseMoodleIds = [
      ...new Set(enrolments.map((e) => e.courseMoodleId)),
    ];

    // Get the courses
    const courses = await this.courseRepository
      .createQueryBuilder('course')
      .where('course.moodleId IN (:...ids)', { ids: courseMoodleIds })
      .orderBy('course.fullname', 'ASC')
      .getMany();

    // Add counts for each course (batch query)
    const courseIdsForCounts = courses.map((c) => c.moodleId);
    const allEnrolments =
      courseIdsForCounts.length > 0
        ? await this.enrolmentRepository.find({
            where: {
              courseMoodleId: In(courseIdsForCounts),
              enrolStatus: 'active',
            },
          })
        : [];
    const studentCountMap = new Map<number, number>();
    const teacherCountMap = new Map<number, number>();
    for (const e of allEnrolments) {
      const mid = e.courseMoodleId;
      if (e.roleCode === 'student') {
        studentCountMap.set(mid, (studentCountMap.get(mid) || 0) + 1);
      } else if (e.roleCode.toLowerCase().includes('teacher')) {
        teacherCountMap.set(mid, (teacherCountMap.get(mid) || 0) + 1);
      }
    }
    const coursesWithCounts: CourseWithCounts[] = courses.map((course) => ({
      ...course,
      studentCount: studentCountMap.get(course.moodleId) || 0,
      teacherCount: teacherCountMap.get(course.moodleId) || 0,
    }));

    return coursesWithCounts;
  }

  /**
   * Get enrolled users with their details
   */
  async getEnrolledUsersWithDetails(
    courseId: number,
  ): Promise<EnrolledUserWithDetails[]> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      return [];
    }

    const enrolments = await this.enrolmentRepository.find({
      where: {
        courseMoodleId: course.moodleId,
        enrolStatus: 'active',
      },
    });

    // Convert bigint to string for consistent comparison (PostgreSQL bigint comes as string)
    const userMoodleIds = enrolments.map((e) => String(e.userMoodleId));

    if (userMoodleIds.length === 0) {
      return [];
    }

    const users = await this.moodleUserRepository
      .createQueryBuilder('user')
      .where('user.moodleId IN (:...ids)', { ids: userMoodleIds })
      .getMany();

    // Use string keys for consistent Map lookup with bigint values
    const userMap = new Map(users.map((u) => [String(u.moodleId), u]));

    return enrolments
      .map((enrolment) => {
        const user = userMap.get(String(enrolment.userMoodleId));
        if (!user) return null;

        return {
          id: user.id,
          moodleId: Number(user.moodleId),
          username: user.username,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          roleCode: enrolment.roleCode,
          enrolStatus: enrolment.enrolStatus,
          lastCourseAccess: enrolment.lastCourseAccess,
        };
      })
      .filter((u): u is EnrolledUserWithDetails => u !== null);
  }

  /**
   * Delete a course (local only, does not delete from Moodle)
   */
  async delete(id: number): Promise<void> {
    const course = await this.courseRepository.findOne({ where: { id } });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Delete associated enrollments
    await this.enrolmentRepository.delete({ courseMoodleId: course.moodleId });

    // Delete the course
    await this.courseRepository.delete(id);

    this.logger.log(`Deleted course ${id} (Moodle ID: ${course.moodleId})`);
  }

  // =====================
  // TEACHER ASSIGNMENT METHODS
  // =====================

  /**
   * Assign teachers to a course
   */
  async assignTeachers(
    courseMoodleId: number,
    teacherIds: number[],
    adminUserId: number,
    courseName?: string,
  ): Promise<CourseTeacher[]> {
    // Verify teachers exist
    const teachers = await this.userRepository.find({
      where: { id: In(teacherIds), isActive: true },
    });

    if (teachers.length !== teacherIds.length) {
      const foundIds = teachers.map((t) => t.id);
      const notFoundIds = teacherIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `Teachers not found: ${notFoundIds.join(', ')}`,
      );
    }

    // Check for existing assignments
    const existingAssignments = await this.courseTeacherRepository.find({
      where: {
        courseMoodleId,
        teacherId: In(teacherIds),
      },
    });

    const existingTeacherIds = existingAssignments.map((a) =>
      Number(a.teacherId),
    );
    const newTeacherIds = teacherIds.filter(
      (id) => !existingTeacherIds.includes(Number(id)),
    );

    if (newTeacherIds.length === 0) {
      return existingAssignments;
    }

    // Create new assignments
    const newAssignments = newTeacherIds.map((teacherId) =>
      this.courseTeacherRepository.create({
        courseMoodleId,
        courseName,
        teacherId,
        isPrimary:
          existingAssignments.length === 0 &&
          newTeacherIds.indexOf(teacherId) === 0,
      }),
    );

    const savedAssignments =
      await this.courseTeacherRepository.save(newAssignments);

    // Ensure all assigned teachers have the TEACHER role
    await this.ensureTeachersHaveRole(teachers);

    await this.auditService.log({
      actorUserId: adminUserId,
      action: 'course.teachers_assigned',
      entity: 'course_teachers',
      entityKey: `${courseMoodleId}`,
      afterData: { teacherIds: newTeacherIds },
      source: 'app',
    });

    return [...existingAssignments, ...savedAssignments];
  }

  /**
   * Ensure all teachers have the TEACHER role assigned
   * Removes STUDENT role and adds TEACHER role if not present
   */
  private async ensureTeachersHaveRole(teachers: User[]): Promise<void> {
    const teacherRole = await this.roleRepository.findOne({
      where: { code: RoleCode.TEACHER },
    });

    if (!teacherRole) {
      this.logger.warn('TEACHER role not found in database');
      return;
    }

    for (const teacher of teachers) {
      // Check if user already has TEACHER role
      if (teacher.roles.some((r) => r.code === RoleCode.TEACHER)) {
        continue;
      }

      // Remove STUDENT role and add TEACHER role
      teacher.roles = teacher.roles.filter((r) => r.code !== RoleCode.STUDENT);
      teacher.roles.push(teacherRole);
      await this.userRepository.save(teacher);
      this.logger.log(
        `Assigned TEACHER role to user ${teacher.email} (id: ${teacher.id})`,
      );
    }
  }

  /**
   * Remove a teacher from a course
   */
  async removeTeacher(
    courseMoodleId: number,
    teacherId: number,
    adminUserId: number,
  ): Promise<void> {
    const assignment = await this.courseTeacherRepository.findOne({
      where: { courseMoodleId, teacherId },
    });

    if (!assignment) {
      throw new NotFoundException('Teacher assignment not found');
    }

    await this.courseTeacherRepository.delete(assignment.id);

    await this.auditService.log({
      actorUserId: adminUserId,
      action: 'course.teacher_removed',
      entity: 'course_teachers',
      entityKey: `${courseMoodleId}`,
      beforeData: assignment,
      source: 'app',
    });
  }

  /**
   * Get teachers assigned to a course
   */
  async getTeachersForCourse(courseMoodleId: number): Promise<CourseTeacher[]> {
    try {
      return await this.courseTeacherRepository.find({
        where: { courseMoodleId },
        relations: ['teacher'],
        order: { isPrimary: 'DESC', createdAt: 'ASC' },
      });
    } catch (error) {
      this.logger.error(
        `Error fetching teachers for course ${courseMoodleId}: ${error.message}`,
        error.stack,
      );
      // Return empty array instead of crashing
      return [];
    }
  }

  /**
   * Get all courses where a teacher is assigned (with full course details)
   */
  async getCoursesForTeacher(teacherId: number): Promise<CourseWithCounts[]> {
    // Get teacher's course assignments
    const assignments = await this.courseTeacherRepository.find({
      where: { teacherId },
      order: { createdAt: 'DESC' },
    });

    if (assignments.length === 0) {
      return [];
    }

    // Get the courseMoodleIds (convert to numbers - bigint comes as string from PostgreSQL)
    const courseMoodleIds = assignments.map((a) => Number(a.courseMoodleId));

    // Get full course details
    const courses = await this.courseRepository.find({
      where: { moodleId: In(courseMoodleIds) },
    });

    // Add counts for each course (batch query)
    const courseIdsForCounts = courses.map((c) => c.moodleId);
    const allEnrolments =
      courseIdsForCounts.length > 0
        ? await this.enrolmentRepository.find({
            where: {
              courseMoodleId: In(courseIdsForCounts),
              enrolStatus: 'active',
            },
          })
        : [];
    const studentCountMap = new Map<number, number>();
    const teacherCountMap = new Map<number, number>();
    for (const e of allEnrolments) {
      const mid = e.courseMoodleId;
      if (e.roleCode === 'student') {
        studentCountMap.set(mid, (studentCountMap.get(mid) || 0) + 1);
      } else if (e.roleCode.toLowerCase().includes('teacher')) {
        teacherCountMap.set(mid, (teacherCountMap.get(mid) || 0) + 1);
      }
    }
    const coursesWithCounts: CourseWithCounts[] = courses.map((course) => ({
      ...course,
      studentCount: studentCountMap.get(course.moodleId) || 0,
      teacherCount: teacherCountMap.get(course.moodleId) || 0,
    }));

    return coursesWithCounts;
  }

  /**
   * Set a teacher as primary for a course
   */
  async setPrimaryTeacher(
    courseMoodleId: number,
    teacherId: number,
    adminUserId: number,
  ): Promise<CourseTeacher> {
    const assignment = await this.courseTeacherRepository.findOne({
      where: { courseMoodleId, teacherId },
    });

    if (!assignment) {
      throw new NotFoundException('Teacher assignment not found');
    }

    // Remove primary from all other teachers
    await this.courseTeacherRepository.update(
      { courseMoodleId },
      { isPrimary: false },
    );

    // Set this teacher as primary
    assignment.isPrimary = true;
    const updated = await this.courseTeacherRepository.save(assignment);

    await this.auditService.log({
      actorUserId: adminUserId,
      action: 'course.primary_teacher_set',
      entity: 'course_teachers',
      entityKey: `${courseMoodleId}`,
      afterData: { teacherId },
      source: 'app',
    });

    return updated;
  }

  /**
   * Toggle course visibility (local + Moodle sync)
   */
  async toggleVisibility(
    courseId: number,
    adminUserId: number,
  ): Promise<CourseWithCounts> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const previousVisibility = course.visible;
    const newVisibility = !previousVisibility;

    // Update in Moodle first
    try {
      const result = await this.moodleClient.updateCourseVisibility(
        course.moodleId,
        newVisibility,
      );
      this.logger.log(
        `Updated course visibility in Moodle: ${course.moodleId} -> ${newVisibility}. Result: ${JSON.stringify(result)}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update visibility in Moodle for course ${course.moodleId}: ${error.message}`,
        error.stack,
      );
      // Si Moodle falla, aún permitimos actualizar localmente pero avisamos
      this.logger.warn('Continuing with local update only due to Moodle error');
    }

    // Update locally
    course.visible = newVisibility;
    course.lastSyncedAt = new Date();
    await this.courseRepository.save(course);

    // Log audit
    await this.auditService.log({
      actorUserId: adminUserId,
      action: 'course.visibility_toggled',
      entity: 'moodle_courses',
      entityKey: `${course.id}`,
      beforeData: { visible: previousVisibility },
      afterData: { visible: newVisibility },
      source: 'app',
    });

    // Get counts for response
    const [studentCount, teacherCount] = await Promise.all([
      this.enrolmentRepository.count({
        where: {
          courseMoodleId: course.moodleId,
          roleCode: 'student',
          enrolStatus: 'active',
        },
      }),
      this.enrolmentRepository.count({
        where: {
          courseMoodleId: course.moodleId,
          roleCode: ILike('%teacher%'),
          enrolStatus: 'active',
        },
      }),
    ]);

    return {
      ...course,
      studentCount,
      teacherCount,
    };
  }
}
