import {
  Controller,
  Get,
  Post,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleCode } from '../../users/entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncState } from '../entities/sync-state.entity';
import { MoodleClientService } from '../../moodle-integration/moodle-client.service';
import { MoodleSyncService } from '../../moodle-integration/moodle-sync.service';
import { MoodleUser } from '../../moodle-integration/entities/moodle-user.entity';
import { MoodleCourse } from '../../moodle-integration/entities/moodle-course.entity';
import { MoodleEnrolment } from '../../moodle-integration/entities/moodle-enrolment.entity';
import { MoodleGradeItem } from '../../moodle-integration/entities/moodle-grade-item.entity';
import { MoodleGrade } from '../../moodle-integration/entities/moodle-grade.entity';
import { MoodleCategory } from '../../moodle-integration/entities/moodle-category.entity';
import { AuditService } from '../services/audit.service';

@Controller('integrations/moodle')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationController {
  constructor(
    private readonly moodleClient: MoodleClientService,
    private readonly moodleSyncService: MoodleSyncService,
    private readonly auditService: AuditService,
    @InjectRepository(SyncState)
    private readonly syncStateRepository: Repository<SyncState>,
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
  ) {}

  /**
   * Check Moodle connectivity and authentication
   * GET /integrations/moodle/health
   */
  @Get('health')
  @Roles(RoleCode.ADMIN)
  async checkHealth() {
    const startTime = Date.now();

    try {
      // Try to fetch site info or a simple API call
      const courses = await this.moodleClient.getCourses();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        moodleConnected: true,
        responseTimeMs: responseTime,
        coursesAvailable: courses.length,
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: 'unhealthy',
        moodleConnected: false,
        responseTimeMs: responseTime,
        error: error.message,
        checkedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get detailed integration status including sync states
   * GET /integrations/moodle/status
   */
  @Get('status')
  @Roles(RoleCode.ADMIN)
  async getStatus() {
    // Get sync states
    const syncStates = await this.syncStateRepository.find({
      order: { updatedAt: 'DESC' },
    });

    // Get counts from mirror tables
    const [
      usersCount,
      categoriesCount,
      coursesCount,
      enrolmentsCount,
      gradeItemsCount,
      gradesCount,
    ] = await Promise.all([
      this.moodleUserRepository.count(),
      this.moodleCategoryRepository.count(),
      this.moodleCourseRepository.count(),
      this.moodleEnrolmentRepository.count(),
      this.moodleGradeItemRepository.count(),
      this.moodleGradeRepository.count(),
    ]);

    // Check Moodle connectivity
    let moodleStatus = 'unknown';
    let moodleCoursesCount = 0;
    try {
      const courses = await this.moodleClient.getCourses();
      moodleStatus = 'connected';
      moodleCoursesCount = courses.length;
    } catch {
      moodleStatus = 'disconnected';
    }

    return {
      moodle: {
        status: moodleStatus,
        coursesInMoodle: moodleCoursesCount,
      },
      mirror: {
        users: usersCount,
        categories: categoriesCount,
        courses: coursesCount,
        enrolments: enrolmentsCount,
        gradeItems: gradeItemsCount,
        grades: gradesCount,
      },
      syncStates: syncStates.map((s) => ({
        entity: s.entity,
        lastCheckpoint: s.lastCheckpoint,
        lastSyncedAt: s.updatedAt,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Trigger initial bootstrap sync (full import)
   * POST /integrations/moodle/sync/bootstrap
   */
  @Post('sync/bootstrap')
  @Roles(RoleCode.ADMIN)
  async bootstrap() {
    try {
      // Log the action
      await this.auditService.log({
        action: 'sync.bootstrap.started',
        entity: 'integration',
        entityKey: 'moodle',
        source: 'admin',
      });

      // Reset sync states to force full sync
      await this.syncStateRepository.delete({});

      // Perform full sync
      await this.moodleSyncService.syncAll();

      // Log completion
      await this.auditService.log({
        action: 'sync.bootstrap.completed',
        entity: 'integration',
        entityKey: 'moodle',
        source: 'admin',
      });

      // Get updated counts
      const [
        usersCount,
        categoriesCount,
        coursesCount,
        enrolmentsCount,
        gradeItemsCount,
        gradesCount,
      ] = await Promise.all([
        this.moodleUserRepository.count(),
        this.moodleCategoryRepository.count(),
        this.moodleCourseRepository.count(),
        this.moodleEnrolmentRepository.count(),
        this.moodleGradeItemRepository.count(),
        this.moodleGradeRepository.count(),
      ]);

      return {
        success: true,
        message: 'Bootstrap sync completed successfully',
        syncedCounts: {
          users: usersCount,
          categories: categoriesCount,
          courses: coursesCount,
          enrolments: enrolmentsCount,
          gradeItems: gradeItemsCount,
          grades: gradesCount,
        },
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      await this.auditService.log({
        action: 'sync.bootstrap.failed',
        entity: 'integration',
        entityKey: 'moodle',
        afterData: { error: error.message },
        source: 'admin',
      });

      throw new HttpException(
        {
          success: false,
          message: 'Bootstrap sync failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Trigger reconciliation (compare and fix divergences)
   * POST /integrations/moodle/sync/reconcile
   */
  @Post('sync/reconcile')
  @Roles(RoleCode.ADMIN)
  async reconcile() {
    try {
      await this.auditService.log({
        action: 'sync.reconcile.started',
        entity: 'integration',
        entityKey: 'moodle',
        source: 'admin',
      });

      // Get counts before reconciliation
      const beforeCounts = {
        users: await this.moodleUserRepository.count(),
        categories: await this.moodleCategoryRepository.count(),
        courses: await this.moodleCourseRepository.count(),
        enrolments: await this.moodleEnrolmentRepository.count(),
        gradeItems: await this.moodleGradeItemRepository.count(),
        grades: await this.moodleGradeRepository.count(),
      };

      // Perform full sync to reconcile
      await this.moodleSyncService.syncAll();

      // Get counts after reconciliation
      const afterCounts = {
        users: await this.moodleUserRepository.count(),
        categories: await this.moodleCategoryRepository.count(),
        courses: await this.moodleCourseRepository.count(),
        enrolments: await this.moodleEnrolmentRepository.count(),
        gradeItems: await this.moodleGradeItemRepository.count(),
        grades: await this.moodleGradeRepository.count(),
      };

      // Calculate differences
      const differences = {
        users: afterCounts.users - beforeCounts.users,
        categories: afterCounts.categories - beforeCounts.categories,
        courses: afterCounts.courses - beforeCounts.courses,
        enrolments: afterCounts.enrolments - beforeCounts.enrolments,
        gradeItems: afterCounts.gradeItems - beforeCounts.gradeItems,
        grades: afterCounts.grades - beforeCounts.grades,
      };

      await this.auditService.log({
        action: 'sync.reconcile.completed',
        entity: 'integration',
        entityKey: 'moodle',
        beforeData: beforeCounts,
        afterData: afterCounts,
        source: 'admin',
      });

      return {
        success: true,
        message: 'Reconciliation completed successfully',
        before: beforeCounts,
        after: afterCounts,
        differences,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      await this.auditService.log({
        action: 'sync.reconcile.failed',
        entity: 'integration',
        entityKey: 'moodle',
        afterData: { error: error.message },
        source: 'admin',
      });

      throw new HttpException(
        {
          success: false,
          message: 'Reconciliation failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Fix teacher role assignments and course_teachers records
   * POST /integrations/moodle/sync/fix-teachers
   */
  @Post('sync/fix-teachers')
  @Roles(RoleCode.ADMIN)
  async fixTeachers() {
    try {
      await this.auditService.log({
        action: 'sync.fix-teachers.started',
        entity: 'integration',
        entityKey: 'moodle',
        source: 'admin',
      });

      // Fix teacher roles in app_users
      const rolesFixed = await this.moodleSyncService.fixTeacherRoles();

      // Fix course_teachers records
      const courseTeachersFixed =
        await this.moodleSyncService.fixCourseTeachers();

      await this.auditService.log({
        action: 'sync.fix-teachers.completed',
        entity: 'integration',
        entityKey: 'moodle',
        afterData: { rolesFixed, courseTeachersFixed },
        source: 'admin',
      });

      return {
        success: true,
        message: 'Teacher fix completed successfully',
        results: {
          teacherRolesAssigned: rolesFixed,
          courseTeachersCreated: courseTeachersFixed,
        },
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      await this.auditService.log({
        action: 'sync.fix-teachers.failed',
        entity: 'integration',
        entityKey: 'moodle',
        afterData: { error: error.message },
        source: 'admin',
      });

      throw new HttpException(
        {
          success: false,
          message: 'Teacher fix failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
