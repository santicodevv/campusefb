import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { MoodleClientService } from './moodle-client.service';
import { MoodleUser } from './entities/moodle-user.entity';
import { MoodleCourse } from './entities/moodle-course.entity';
import { MoodleEnrolment } from './entities/moodle-enrolment.entity';
import { MoodleGradeItem } from './entities/moodle-grade-item.entity';
import { MoodleGrade } from './entities/moodle-grade.entity';
import { MoodleCategory } from './entities/moodle-category.entity';
import { AcademicProgram } from '../academic-projection/entities/academic-program.entity';
import { User } from '../users/entities/user.entity';
import { Role, RoleCode } from '../users/entities/role.entity';
import { CourseTeacher } from '../academic/entities/course-teacher.entity';

@Injectable()
export class MoodleSyncService {
  private readonly logger = new Logger(MoodleSyncService.name);

  constructor(
    private readonly moodleClient: MoodleClientService,
    @InjectRepository(MoodleUser)
    private readonly moodleUserRepository: Repository<MoodleUser>,
    @InjectRepository(MoodleCourse)
    private readonly moodleCourseRepository: Repository<MoodleCourse>,
    @InjectRepository(MoodleEnrolment)
    private readonly moodleEnrolmentRepository: Repository<MoodleEnrolment>,
    @InjectRepository(MoodleGradeItem)
    private readonly moodleGradeItemRepository: Repository<MoodleGradeItem>,
    @InjectRepository(MoodleGrade)
    private readonly moodleGradeRepository: Repository<MoodleGrade>,
    @InjectRepository(MoodleCategory)
    private readonly moodleCategoryRepository: Repository<MoodleCategory>,
    @InjectRepository(AcademicProgram)
    private readonly programRepository: Repository<AcademicProgram>,
    @InjectRepository(User)
    private readonly appUserRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(CourseTeacher)
    private readonly courseTeacherRepository: Repository<CourseTeacher>,
  ) {}

  async syncUsers(sinceTimestamp?: number): Promise<void> {
    this.logger.log('Starting user sync...');

    try {
      const moodleUsers = await this.moodleClient.getUsers();
      let syncedCount = 0;

      for (const mUser of moodleUsers) {
        // Skip if doing incremental sync and user hasn't been modified
        if (
          sinceTimestamp &&
          mUser.timemodified &&
          mUser.timemodified < sinceTimestamp
        ) {
          continue;
        }

        const existingUser = await this.moodleUserRepository.findOne({
          where: { moodleId: mUser.id },
        });

        // A user edited locally in the app is authoritative: the sync must
        // not overwrite its data with the Moodle snapshot.
        if (existingUser) {
          const appUserForMoodle = await this.appUserRepository.findOne({
            where: { moodleUserId: mUser.id },
          });
          if (appUserForMoodle?.locallyEdited) {
            syncedCount++;
            continue;
          }
        }

        const userType = this.determineUserType(mUser);
        const userData = {
          moodleId: mUser.id,
          username: mUser.username,
          email: mUser.email,
          firstname: mUser.firstname,
          lastname: mUser.lastname,
          userType,
          suspended: mUser.suspended || false,
          timemodified: mUser.timemodified
            ? new Date(mUser.timemodified * 1000)
            : undefined,
          lastAccess: mUser.lastaccess
            ? new Date(mUser.lastaccess * 1000)
            : null,
          lastSyncedAt: new Date(),
        };

        if (existingUser) {
          await this.moodleUserRepository.update(existingUser.id, userData);
        } else {
          await this.moodleUserRepository.save(userData);
        }

        // Also create/update app_user for login capability
        await this.syncAppUser(mUser, userType);
        syncedCount++;
      }

      this.logger.log(`Synced ${syncedCount} users`);
    } catch (error) {
      this.logger.error(`Error syncing users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create or update an app_user from a Moodle user
   * This allows the user to login to the application
   */
  private async syncAppUser(moodleUser: any, userType: string): Promise<void> {
    if (!moodleUser.email) {
      this.logger.warn(
        `Skipping app_user creation for Moodle user ${moodleUser.id}: no email`,
      );
      return;
    }

    try {
      const existingAppUser = await this.appUserRepository.findOne({
        where: { moodleUserId: moodleUser.id },
        relations: ['roles'],
      });

      // Determine role based on userType
      const roleCode = this.mapUserTypeToRole(userType);
      const role = await this.roleRepository.findOne({
        where: { code: roleCode },
      });

      if (!role) {
        this.logger.warn(
          `Role ${roleCode} not found, skipping app_user sync for ${moodleUser.email}`,
        );
        return;
      }

      const displayName =
        `${moodleUser.firstname || ''} ${moodleUser.lastname || ''}`.trim() ||
        moodleUser.username;

      if (existingAppUser) {
        // Update existing app_user, unless it was edited locally (authoritative)
        if (!existingAppUser.locallyEdited) {
          existingAppUser.email = moodleUser.email;
          existingAppUser.username =
            moodleUser.username || existingAppUser.username;
          existingAppUser.displayName = displayName;
          existingAppUser.isActive = !moodleUser.suspended;
        }

        // Add role if not already assigned
        if (!existingAppUser.roles.some((r) => r.code === roleCode)) {
          existingAppUser.roles.push(role);
        }

        await this.appUserRepository.save(existingAppUser);
      } else {
        // Check if user exists by email (might have been created manually)
        const existingByEmail = await this.appUserRepository.findOne({
          where: { email: moodleUser.email },
          relations: ['roles'],
        });

        if (existingByEmail) {
          // Link existing user to Moodle
          existingByEmail.moodleUserId = moodleUser.id;
          existingByEmail.username =
            moodleUser.username || existingByEmail.username;
          existingByEmail.displayName = displayName;
          if (!existingByEmail.roles.some((r) => r.code === roleCode)) {
            existingByEmail.roles.push(role);
          }
          await this.appUserRepository.save(existingByEmail);
        } else {
          // Create new app_user with default password (user should reset)
          const defaultPassword = await bcrypt.hash(
            `Moodle${moodleUser.id}!`,
            10,
          );

          const newAppUser = this.appUserRepository.create({
            email: moodleUser.email,
            username: moodleUser.username || null,
            passwordHash: defaultPassword,
            displayName,
            moodleUserId: moodleUser.id,
            isActive: !moodleUser.suspended,
            roles: [role],
          });

          await this.appUserRepository.save(newAppUser);
          this.logger.log(
            `Created app_user for ${moodleUser.email} with role ${roleCode}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error syncing app_user for Moodle user ${moodleUser.id}: ${error.message}`,
      );
      // Don't throw - continue with other users
    }
  }

  private mapUserTypeToRole(userType: string): RoleCode {
    switch (userType) {
      case 'teacher':
        return RoleCode.TEACHER;
      case 'student':
        return RoleCode.STUDENT;
      default:
        return RoleCode.STUDENT; // Default to student
    }
  }

  async syncCourses(sinceTimestamp?: number): Promise<void> {
    this.logger.log('Starting course sync...');

    try {
      const moodleCourses = await this.moodleClient.getCourses();
      let syncedCount = 0;

      for (const mCourse of moodleCourses) {
        // Skip if doing incremental sync and course hasn't been modified
        if (
          sinceTimestamp &&
          mCourse.timemodified &&
          mCourse.timemodified < sinceTimestamp
        ) {
          continue;
        }

        const existingCourse = await this.moodleCourseRepository.findOne({
          where: { moodleId: mCourse.id },
        });

        const courseData = {
          moodleId: mCourse.id,
          shortname: mCourse.shortname,
          fullname: mCourse.fullname,
          categoryId: mCourse.categoryid ?? mCourse.category,
          visible: mCourse.visible === 1,
          startdate: mCourse.startdate
            ? new Date(mCourse.startdate * 1000)
            : undefined,
          enddate: mCourse.enddate
            ? new Date(mCourse.enddate * 1000)
            : undefined,
          timemodified: mCourse.timemodified
            ? new Date(mCourse.timemodified * 1000)
            : undefined,
          lastSyncedAt: new Date(),
        };

        if (existingCourse) {
          await this.moodleCourseRepository.update(
            existingCourse.id,
            courseData,
          );
        } else {
          await this.moodleCourseRepository.save(courseData);
        }
        syncedCount++;
      }

      this.logger.log(`Synced ${syncedCount} courses`);
    } catch (error) {
      this.logger.error(`Error syncing courses: ${error.message}`);
      throw error;
    }
  }

  async syncEnrolments(courseMoodleId: number): Promise<void> {
    this.logger.log(`Starting enrolment sync for course ${courseMoodleId}...`);

    try {
      const enrolledUsers =
        await this.moodleClient.getEnrolledUsers(courseMoodleId);

      // Track the (user, role) pairs Moodle currently reports so that
      // stale local enrolments (de-enrolled in Moodle) can be deactivated.
      const moodleKeys = new Set<string>();

      for (const enrollment of enrolledUsers) {
        for (const role of enrollment.roles || []) {
          moodleKeys.add(`${enrollment.id}:${role.shortname}`);

          const existingEnrolment =
            await this.moodleEnrolmentRepository.findOne({
              where: {
                courseMoodleId,
                userMoodleId: enrollment.id,
                roleCode: role.shortname,
              },
            });

          const enrolmentData = {
            courseMoodleId,
            userMoodleId: enrollment.id,
            roleCode: role.shortname,
            enrolStatus: 'active',
            lastCourseAccess: enrollment.lastcourseaccess
              ? new Date(enrollment.lastcourseaccess * 1000)
              : null,
            lastSyncedAt: new Date(),
          };

          if (existingEnrolment) {
            await this.moodleEnrolmentRepository.update(
              existingEnrolment.id,
              enrolmentData,
            );
          } else {
            await this.moodleEnrolmentRepository.save(enrolmentData);
          }

          // Auto-assign TEACHER role and create course_teacher record if enrolled as teacher/editingteacher
          if (
            role.shortname === 'teacher' ||
            role.shortname === 'editingteacher'
          ) {
            await this.ensureTeacherRole(enrollment.id);
            await this.ensureCourseTeacher(courseMoodleId, enrollment.id);
          }
        }
      }

      // Deactivate enrolments that no longer exist in Moodle so the app
      // keeps matching the source of truth.
      const localEnrolments = await this.moodleEnrolmentRepository.find({
        where: { courseMoodleId, enrolStatus: 'active' },
      });
      let deactivated = 0;
      for (const local of localEnrolments) {
        if (!moodleKeys.has(`${local.userMoodleId}:${local.roleCode}`)) {
          await this.moodleEnrolmentRepository.update(local.id, {
            enrolStatus: 'inactive',
          });
          deactivated++;
        }
      }
      if (deactivated > 0) {
        this.logger.log(
          `Deactivated ${deactivated} stale enrolments for course ${courseMoodleId}`,
        );
      }

      this.logger.log(`Synced enrolments for course ${courseMoodleId}`);
    } catch (error) {
      this.logger.error(
        `Error syncing enrolments for course ${courseMoodleId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Ensure a Moodle user with teacher enrollment gets the TEACHER role in app_users
   */
  private async ensureTeacherRole(moodleUserId: number): Promise<void> {
    try {
      const appUser = await this.appUserRepository.findOne({
        where: { moodleUserId },
        relations: ['roles'],
      });

      if (!appUser) return;

      // Check if already has TEACHER role
      if (appUser.roles.some((r) => r.code === RoleCode.TEACHER)) return;

      const teacherRole = await this.roleRepository.findOne({
        where: { code: RoleCode.TEACHER },
      });

      if (!teacherRole) {
        this.logger.warn('TEACHER role not found in database');
        return;
      }

      // Remove STUDENT role and add TEACHER role
      appUser.roles = appUser.roles.filter((r) => r.code !== RoleCode.STUDENT);
      appUser.roles.push(teacherRole);
      await this.appUserRepository.save(appUser);
      this.logger.log(
        `Auto-assigned TEACHER role (removed STUDENT) to user ${appUser.email} (moodleId: ${moodleUserId})`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to auto-assign TEACHER role for moodleId ${moodleUserId}: ${error.message}`,
      );
    }
  }

  /**
   * Create a course_teacher record linking a teacher to a course
   * This allows teachers to see their assigned courses in the app
   */
  private async ensureCourseTeacher(
    courseMoodleId: number,
    moodleUserId: number,
  ): Promise<void> {
    try {
      // Find the app user for this moodle user
      const appUser = await this.appUserRepository.findOne({
        where: { moodleUserId },
      });

      if (!appUser) {
        this.logger.debug(
          `No app_user found for moodleId ${moodleUserId}, skipping course_teacher creation`,
        );
        return;
      }

      // Check if course_teacher record already exists
      const existingCourseTeacher = await this.courseTeacherRepository.findOne({
        where: {
          courseMoodleId,
          teacherId: appUser.id,
        },
      });

      if (existingCourseTeacher) {
        this.logger.debug(
          `Course teacher already exists for course ${courseMoodleId} and teacher ${appUser.id}`,
        );
        return;
      }

      // Get course name from moodle_courses
      const course = await this.moodleCourseRepository.findOne({
        where: { moodleId: courseMoodleId },
      });

      // Create course_teacher record
      const courseTeacher = this.courseTeacherRepository.create({
        courseMoodleId,
        teacherId: appUser.id,
        courseName: course?.fullname || course?.shortname || null,
        isPrimary: true,
      });

      await this.courseTeacherRepository.save(courseTeacher);
      this.logger.log(
        `Created course_teacher: course ${courseMoodleId} -> teacher ${appUser.email} (id: ${appUser.id})`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to create course_teacher for course ${courseMoodleId} and moodleId ${moodleUserId}: ${error.message}`,
      );
    }
  }

  /**
   * Scan ALL existing moodle_enrolments for teacher/editingteacher roles
   * and assign the TEACHER role to corresponding app_users.
   * Runs on startup so no manual sync needed.
   */
  async fixTeacherRoles(): Promise<number> {
    this.logger.log('Scanning enrolments to fix teacher roles...');

    // Get all enrolments with teacher roles
    const teacherEnrolments = await this.moodleEnrolmentRepository
      .createQueryBuilder('e')
      .select('DISTINCT e.userMoodleId', 'userMoodleId')
      .where('e.roleCode IN (:...roles)', {
        roles: ['teacher', 'editingteacher'],
      })
      .getRawMany();

    const teacherMoodleIds = teacherEnrolments.map((e) =>
      Number(e.userMoodleId),
    );

    if (teacherMoodleIds.length === 0) {
      this.logger.log('No teacher enrolments found.');
      return 0;
    }

    const teacherRole = await this.roleRepository.findOne({
      where: { code: RoleCode.TEACHER },
    });

    if (!teacherRole) {
      this.logger.warn('TEACHER role not found in database');
      return 0;
    }

    let assignedCount = 0;

    for (const moodleId of teacherMoodleIds) {
      const appUser = await this.appUserRepository.findOne({
        where: { moodleUserId: moodleId },
        relations: ['roles'],
      });

      if (!appUser) continue;
      if (appUser.roles.some((r) => r.code === RoleCode.TEACHER)) continue;

      // Remove STUDENT role and add TEACHER role
      appUser.roles = appUser.roles.filter((r) => r.code !== RoleCode.STUDENT);
      appUser.roles.push(teacherRole);
      await this.appUserRepository.save(appUser);
      assignedCount++;
      this.logger.log(
        `Fixed: assigned TEACHER role (removed STUDENT) to ${appUser.email}`,
      );
    }

    this.logger.log(
      `Teacher role fix complete. Assigned ${assignedCount} new TEACHER roles.`,
    );
    return assignedCount;
  }

  /**
   * Scan ALL existing moodle_enrolments for teacher/editingteacher roles
   * and create course_teachers records to link teachers with their courses.
   * This ensures teachers can see their courses in the app.
   */
  async fixCourseTeachers(): Promise<number> {
    this.logger.log('Scanning enrolments to fix course_teachers...');

    // Get all enrolments with teacher roles
    const teacherEnrolments = await this.moodleEnrolmentRepository
      .createQueryBuilder('e')
      .select(['e.courseMoodleId', 'e.userMoodleId'])
      .where('e.roleCode IN (:...roles)', {
        roles: ['teacher', 'editingteacher'],
      })
      .getRawMany();

    if (teacherEnrolments.length === 0) {
      this.logger.log('No teacher enrolments found.');
      return 0;
    }

    let createdCount = 0;

    for (const enrolment of teacherEnrolments) {
      const courseMoodleId = Number(enrolment.e_course_moodle_id);
      const userMoodleId = Number(enrolment.e_user_moodle_id);

      // Find the app user for this moodle user
      const appUser = await this.appUserRepository.findOne({
        where: { moodleUserId: userMoodleId },
      });

      if (!appUser) continue;

      // Check if course_teacher record already exists
      const existingCourseTeacher = await this.courseTeacherRepository.findOne({
        where: {
          courseMoodleId,
          teacherId: appUser.id,
        },
      });

      if (existingCourseTeacher) continue;

      // Get course name from moodle_courses
      const course = await this.moodleCourseRepository.findOne({
        where: { moodleId: courseMoodleId },
      });

      // Create course_teacher record
      const courseTeacher = this.courseTeacherRepository.create({
        courseMoodleId,
        teacherId: appUser.id,
        courseName: course?.fullname || course?.shortname || null,
        isPrimary: true,
      });

      await this.courseTeacherRepository.save(courseTeacher);
      createdCount++;
      this.logger.log(
        `Fixed: created course_teacher for course ${courseMoodleId} -> teacher ${appUser.email}`,
      );
    }

    this.logger.log(
      `Course teachers fix complete. Created ${createdCount} new course_teacher records.`,
    );
    return createdCount;
  }

  async syncAllEnrolments(): Promise<number> {
    this.logger.log('Starting enrolments sync for all courses...');

    const courses = await this.moodleCourseRepository.find();
    let totalEnrolments = 0;

    for (const course of courses) {
      try {
        await this.syncEnrolments(course.moodleId);
        const count = await this.moodleEnrolmentRepository.count({
          where: { courseMoodleId: course.moodleId },
        });
        totalEnrolments += count;
      } catch (error) {
        this.logger.warn(
          `Failed to sync enrolments for course ${course.moodleId}: ${error.message}`,
        );
        // Continue with other courses
      }
    }

    this.logger.log(
      `Synced enrolments for ${courses.length} courses (${totalEnrolments} total enrolments)`,
    );
    return totalEnrolments;
  }

  async syncGradeItems(courseMoodleId: number): Promise<void> {
    this.logger.log(
      `Starting grade items sync for course ${courseMoodleId}...`,
    );

    try {
      const gradeData = await this.moodleClient.getGrades(courseMoodleId);

      if (!gradeData?.usergrades || gradeData.usergrades.length === 0) {
        this.logger.debug(`No grade data found for course ${courseMoodleId}`);
        return;
      }

      // Get grade items from the first user's grades (structure is same for all users)
      const gradeItems = gradeData.usergrades[0]?.gradeitems || [];

      for (const item of gradeItems) {
        const existingItem = await this.moodleGradeItemRepository.findOne({
          where: {
            courseMoodleId,
            itemMoodleId: item.id,
          },
        });

        const itemData = {
          courseMoodleId,
          itemMoodleId: item.id,
          itemname: item.itemname || item.cmid?.toString() || 'Unknown',
          itemtype: item.itemtype || 'mod',
          grademax: item.grademax || 100,
          grademin: item.grademin || 0,
          weight: item.weightraw || null,
          lastSyncedAt: new Date(),
        };

        if (existingItem) {
          await this.moodleGradeItemRepository.update(
            existingItem.id,
            itemData,
          );
        } else {
          await this.moodleGradeItemRepository.save(itemData);
        }
      }

      this.logger.log(
        `Synced ${gradeItems.length} grade items for course ${courseMoodleId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error syncing grade items for course ${courseMoodleId}: ${error.message}`,
      );
      throw error;
    }
  }

  async syncAllGradeItems(): Promise<number> {
    this.logger.log('Starting grade items sync for all courses...');

    const courses = await this.moodleCourseRepository.find();
    let totalItems = 0;

    for (const course of courses) {
      try {
        await this.syncGradeItems(course.moodleId);
        const count = await this.moodleGradeItemRepository.count({
          where: { courseMoodleId: course.moodleId },
        });
        totalItems += count;
      } catch (error) {
        this.logger.warn(
          `Failed to sync grade items for course ${course.moodleId}: ${error.message}`,
        );
        // Continue with other courses
      }
    }

    this.logger.log(
      `Synced grade items for ${courses.length} courses (${totalItems} total items)`,
    );
    return totalItems;
  }

  async syncGrades(
    courseMoodleId: number,
    sinceTimestamp?: number,
  ): Promise<void> {
    this.logger.log(`Starting grades sync for course ${courseMoodleId}...`);

    try {
      const gradeData = await this.moodleClient.getGrades(courseMoodleId);

      if (!gradeData?.usergrades || gradeData.usergrades.length === 0) {
        this.logger.debug(`No grade data found for course ${courseMoodleId}`);
        return;
      }

      let gradesCount = 0;

      for (const userGrade of gradeData.usergrades) {
        const userId = userGrade.userid;
        const gradeItems = userGrade.gradeitems || [];

        for (const item of gradeItems) {
          // Skip if no grade value
          if (item.graderaw === null && item.gradeformatted === '-') {
            continue;
          }

          // Skip if doing incremental sync and grade hasn't been modified
          if (
            sinceTimestamp &&
            item.gradedategraded &&
            item.gradedategraded < sinceTimestamp
          ) {
            continue;
          }

          const existingGrade = await this.moodleGradeRepository.findOne({
            where: {
              courseMoodleId,
              itemMoodleId: item.id,
              userMoodleId: userId,
            },
          });

          const gradeValue = item.graderaw !== null ? item.graderaw : null;

          const gradeDataToSave = {
            courseMoodleId,
            itemMoodleId: item.id,
            userMoodleId: userId,
            grade: gradeValue,
            feedback: item.feedback || undefined,
            timemodified: item.gradedategraded
              ? new Date(item.gradedategraded * 1000)
              : undefined,
            lastSyncedAt: new Date(),
          };

          if (existingGrade) {
            await this.moodleGradeRepository.update(
              existingGrade.id,
              gradeDataToSave,
            );
          } else {
            await this.moodleGradeRepository.save(gradeDataToSave);
          }
          gradesCount++;
        }
      }

      this.logger.log(
        `Synced ${gradesCount} grades for course ${courseMoodleId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error syncing grades for course ${courseMoodleId}: ${error.message}`,
      );
      throw error;
    }
  }

  async syncAllGrades(sinceTimestamp?: number): Promise<number> {
    this.logger.log('Starting grades sync for all courses...');

    const courses = await this.moodleCourseRepository.find();
    let totalGrades = 0;

    for (const course of courses) {
      try {
        await this.syncGrades(course.moodleId, sinceTimestamp);
        const count = await this.moodleGradeRepository.count({
          where: { courseMoodleId: course.moodleId },
        });
        totalGrades += count;
      } catch (error) {
        this.logger.warn(
          `Failed to sync grades for course ${course.moodleId}: ${error.message}`,
        );
        // Continue with other courses
      }
    }

    this.logger.log(
      `Synced grades for ${courses.length} courses (${totalGrades} total grades)`,
    );
    return totalGrades;
  }

  async syncAll(): Promise<void> {
    this.logger.log('Starting full sync...');

    await this.syncUsers();
    await this.syncCategories();
    await this.syncCourses();
    await this.syncAllEnrolments();
    await this.syncAllGradeItems();
    await this.syncAllGrades();

    this.logger.log('Full sync completed!');
  }

  /**
   * Sync categories from Moodle into moodle_categories and also create/update
   * Academic Programs (sga_programs) from those categories. Each Moodle category
   * becomes a Program of the "Proyección de Oferta Académica".
   *
   * Programs already linked to a category (or manually edited) are never
   * overwritten: their name/code can be edited by the admin afterwards.
   */
  async syncCategories(): Promise<{
    synced: number;
    programsCreated: number;
  }> {
    this.logger.log('Starting categories sync from Moodle...');

    const moodleCategories = await this.moodleClient.getCategories();

    this.logger.log(
      `Received ${moodleCategories?.length || 0} categories from Moodle`,
    );

    if (!Array.isArray(moodleCategories) || moodleCategories.length === 0) {
      this.logger.warn('No categories received from Moodle');
      return { synced: 0, programsCreated: 0 };
    }

    let synced = 0;
    let programsCreated = 0;

    for (const mCat of moodleCategories) {
      let category = await this.moodleCategoryRepository.findOne({
        where: { moodleId: mCat.id },
      });

      const categoryData = {
        moodleId: mCat.id,
        name: mCat.name,
        parent: mCat.parent,
        description: mCat.description || '',
        depth: mCat.depth,
        path: mCat.path,
        coursecount: mCat.coursecount,
        visible: mCat.visible === 1,
        timemodified: mCat.timemodified
          ? new Date(mCat.timemodified * 1000)
          : null,
        lastSyncedAt: new Date(),
      };

      if (category) {
        await this.moodleCategoryRepository.update(category.id, categoryData);
      } else {
        category = this.moodleCategoryRepository.create(categoryData);
        await this.moodleCategoryRepository.save(category);
      }

      synced++;

      if (
        (Number(mCat.parent) === 0 || Number(mCat.depth) === 2) &&
        (Number(mCat.coursecount) > 0 || Number(mCat.depth) <= 2)
      ) {
        const created = await this.upsertProgramFromCategory(mCat);
        if (created) programsCreated++;
      }
    }

    this.logger.log(
      `Categories sync completed. Synced: ${synced}, programs created: ${programsCreated}`,
    );
    return { synced, programsCreated };
  }

  /**
   * Create (or link) an AcademicProgram for a Moodle category.
   * Returns true if a new program was created.
   */
  private async upsertProgramFromCategory(category: any): Promise<boolean> {
    // Ya existe un programa vinculado a esta categoría: no lo sobreescribimos
    const linked = await this.programRepository.findOne({
      where: { moodleCategoryId: category.id },
    });
    if (linked) return false;

    // Un programa manual pre-existente con el mismo nombre pasa a vincularse
    const byName = await this.programRepository
      .createQueryBuilder('p')
      .where('LOWER(p.name) = LOWER(:name)', { name: category.name })
      .andWhere('p.moodleCategoryId IS NULL')
      .getOne();
    if (byName) {
      byName.moodleCategoryId = category.id;
      await this.programRepository.save(byName);
      this.logger.log(
        `Linked existing program "${byName.name}" to Moodle category ${category.id}`,
      );
      return false;
    }

    const baseCode = this.generateDefaultCode(category.name);
    let code = baseCode;
    let suffix = 2;
    while (await this.programRepository.findOne({ where: { code } })) {
      code = `${baseCode}-${suffix++}`;
    }

    await this.programRepository.save(
      this.programRepository.create({
        code,
        name: category.name,
        description: `Sincronizado desde la categoría de Moodle "${category.name}"`,
        moodleCategoryId: category.id,
      }),
    );
    this.logger.log(
      `Created AcademicProgram "${category.name}" (${code}) from Moodle category ${category.id}`,
    );
    return true;
  }

  /**
   * Genera un código por defecto a partir del nombre de la categoría.
   * Ej: DIPLOMATURA -> DIPL, LICENCIATURA MINISTERIO -> LIC-MIN
   */
  private generateDefaultCode(name: string): string {
    const normalized = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
    const words = normalized.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].slice(0, 4);
    }
    return words.map((w) => w.slice(0, 3)).join('-');
  }

  private determineUserType(moodleUser: any): string {
    // Lógica simple para determinar el tipo de usuario
    // Esto puede refinarse según las necesidades específicas
    if (moodleUser.username?.includes('student')) return 'student';
    if (moodleUser.username?.includes('teacher')) return 'teacher';
    return 'other';
  }
}
