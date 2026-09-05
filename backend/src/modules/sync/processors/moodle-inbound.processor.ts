import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoodleWebhookPayload } from '../../webhooks/moodle-webhook.controller';
import { MoodleUser } from '../../moodle-integration/entities/moodle-user.entity';
import { MoodleCourse } from '../../moodle-integration/entities/moodle-course.entity';
import { MoodleGrade } from '../../moodle-integration/entities/moodle-grade.entity';
import { MoodleGradeItem } from '../../moodle-integration/entities/moodle-grade-item.entity';
import { MoodleEnrolment } from '../../moodle-integration/entities/moodle-enrolment.entity';
import { MoodleClientService } from '../../moodle-integration/moodle-client.service';
import { AuditService } from '../services/audit.service';

@Processor('moodle-inbound')
export class MoodleInboundProcessor {
  private readonly logger = new Logger(MoodleInboundProcessor.name);

  constructor(
    private readonly moodleClient: MoodleClientService,
    private readonly auditService: AuditService,
    @InjectRepository(MoodleUser)
    private readonly moodleUserRepository: Repository<MoodleUser>,
    @InjectRepository(MoodleCourse)
    private readonly moodleCourseRepository: Repository<MoodleCourse>,
    @InjectRepository(MoodleGrade)
    private readonly moodleGradeRepository: Repository<MoodleGrade>,
    @InjectRepository(MoodleGradeItem)
    private readonly moodleGradeItemRepository: Repository<MoodleGradeItem>,
    @InjectRepository(MoodleEnrolment)
    private readonly moodleEnrolmentRepository: Repository<MoodleEnrolment>,
  ) {}

  @Process('process-webhook')
  async processWebhook(job: Job<MoodleWebhookPayload>) {
    const payload = job.data;

    this.logger.log(`Processing webhook event: ${payload.eventname}`);

    try {
      await this.handleWebhookEvent(payload);

      // Registrar en auditoría
      await this.auditService.log({
        action: 'webhook.processed',
        entity: 'moodle_webhook',
        entityKey: payload.eventname,
        afterData: { eventname: payload.eventname, objectid: payload.objectid },
        source: 'moodle',
      });
    } catch (error) {
      this.logger.error(
        `Error processing webhook ${payload.eventname}: ${error.message}`,
      );
      throw error;
    }
  }

  private async handleWebhookEvent(payload: MoodleWebhookPayload) {
    switch (payload.eventname) {
      // Eventos de usuario
      case '\\core\\event\\user_created':
      case '\\core\\event\\user_updated':
        await this.handleUserEvent(payload);
        break;

      // Eventos de curso
      case '\\core\\event\\course_created':
      case '\\core\\event\\course_updated':
        await this.handleCourseEvent(payload);
        break;

      // Eventos de matrícula
      case '\\core\\event\\user_enrolment_created':
      case '\\core\\event\\user_enrolment_updated':
        await this.handleEnrolmentEvent(payload);
        break;

      // Eventos de calificación
      case '\\core\\event\\user_graded':
      case '\\mod_assign\\event\\submission_graded':
        await this.handleGradeEvent(payload);
        break;

      default:
        this.logger.debug(`Unhandled event type: ${payload.eventname}`);
    }
  }

  private async handleUserEvent(payload: MoodleWebhookPayload) {
    const userId = payload.userid || payload.objectid;
    if (!userId) return;

    this.logger.log(`Fetching user ${userId} from Moodle`);

    // Obtener datos actualizados de Moodle
    const users = await this.moodleClient.getUsers([
      { key: 'id', value: String(userId) },
    ]);

    if (users.length === 0) return;

    const mUser = users[0];

    const existingUser = await this.moodleUserRepository.findOne({
      where: { moodleId: mUser.id },
    });

    const userData = {
      moodleId: mUser.id,
      username: mUser.username,
      email: mUser.email,
      firstname: mUser.firstname,
      lastname: mUser.lastname,
      userType: 'other',
      suspended: mUser.suspended || false,
      timemodified: mUser.timemodified
        ? new Date(mUser.timemodified * 1000)
        : undefined,
      lastSyncedAt: new Date(),
    };

    if (existingUser) {
      await this.moodleUserRepository.update(existingUser.id, userData);
    } else {
      await this.moodleUserRepository.save(userData);
    }

    this.logger.log(`User ${userId} synced from webhook`);
  }

  private async handleCourseEvent(payload: MoodleWebhookPayload) {
    const courseId = payload.courseid || payload.objectid;
    if (!courseId) return;

    this.logger.log(`Fetching course ${courseId} from Moodle`);

    const courses = await this.moodleClient.getCourses();
    const mCourse = courses.find((c) => c.id === courseId);

    if (!mCourse) return;

    const existingCourse = await this.moodleCourseRepository.findOne({
      where: { moodleId: mCourse.id },
    });

    const courseData = {
      moodleId: mCourse.id,
      shortname: mCourse.shortname,
      fullname: mCourse.fullname,
      categoryId: mCourse.category,
      visible: mCourse.visible === 1,
      startdate: mCourse.startdate
        ? new Date(mCourse.startdate * 1000)
        : undefined,
      enddate: mCourse.enddate ? new Date(mCourse.enddate * 1000) : undefined,
      timemodified: mCourse.timemodified
        ? new Date(mCourse.timemodified * 1000)
        : undefined,
      lastSyncedAt: new Date(),
    };

    if (existingCourse) {
      await this.moodleCourseRepository.update(existingCourse.id, courseData);
    } else {
      await this.moodleCourseRepository.save(courseData);
    }

    this.logger.log(`Course ${courseId} synced from webhook`);
  }

  private async handleEnrolmentEvent(payload: MoodleWebhookPayload) {
    const courseId = payload.courseid;
    const userId = payload.relateduserid || payload.userid;

    if (!courseId || !userId) return;

    this.logger.log(`Syncing enrolment for course ${courseId}, user ${userId}`);

    // Obtener matrículas del curso
    const enrolledUsers = await this.moodleClient.getEnrolledUsers(courseId);
    const enrollment = enrolledUsers.find((e) => e.id === userId);

    if (!enrollment) return;

    for (const role of enrollment.roles || []) {
      const existingEnrolment = await this.moodleEnrolmentRepository.findOne({
        where: {
          courseMoodleId: courseId,
          userMoodleId: userId,
          roleCode: role.shortname,
        },
      });

      const enrolmentData = {
        courseMoodleId: courseId,
        userMoodleId: userId,
        roleCode: role.shortname,
        enrolStatus: 'active',
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
    }

    this.logger.log(`Enrolment synced from webhook`);
  }

  private async handleGradeEvent(payload: MoodleWebhookPayload) {
    const courseId = payload.courseid;
    const userId = payload.relateduserid || payload.userid;

    if (!courseId || !userId) return;

    this.logger.log(`Syncing grades for course ${courseId}, user ${userId}`);

    try {
      // Fetch updated grades from Moodle for this specific user and course
      const gradeData = await this.moodleClient.getGrades(courseId, [userId]);

      if (!gradeData?.usergrades || gradeData.usergrades.length === 0) {
        this.logger.debug(
          `No grade data found for user ${userId} in course ${courseId}`,
        );
        return;
      }

      const userGrade = gradeData.usergrades.find(
        (ug: any) => ug.userid === userId,
      );
      if (!userGrade) return;

      const gradeItems = userGrade.gradeitems || [];
      let syncedCount = 0;

      for (const item of gradeItems) {
        // Skip if no grade value
        if (item.graderaw === null && item.gradeformatted === '-') {
          continue;
        }

        // Ensure grade item exists in our mirror
        await this.ensureGradeItemExists(courseId, item);

        // Sync the grade
        const existingGrade = await this.moodleGradeRepository.findOne({
          where: {
            courseMoodleId: courseId,
            itemMoodleId: item.id,
            userMoodleId: userId,
          },
        });

        const gradeValue = item.graderaw !== null ? item.graderaw : null;
        const gradeDataToSave = {
          courseMoodleId: courseId,
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
        syncedCount++;
      }

      this.logger.log(
        `Synced ${syncedCount} grades for user ${userId} in course ${courseId} from webhook`,
      );
    } catch (error) {
      this.logger.error(`Error syncing grades from webhook: ${error.message}`);
      throw error;
    }
  }

  private async ensureGradeItemExists(
    courseId: number,
    item: any,
  ): Promise<void> {
    const existingItem = await this.moodleGradeItemRepository.findOne({
      where: {
        courseMoodleId: courseId,
        itemMoodleId: item.id,
      },
    });

    if (!existingItem) {
      await this.moodleGradeItemRepository.save({
        courseMoodleId: courseId,
        itemMoodleId: item.id,
        itemname: item.itemname || item.cmid?.toString() || 'Unknown',
        itemtype: item.itemtype || 'mod',
        grademax: item.grademax || 100,
        grademin: item.grademin || 0,
        weight: item.weightraw || null,
        lastSyncedAt: new Date(),
      });
    }
  }
}
