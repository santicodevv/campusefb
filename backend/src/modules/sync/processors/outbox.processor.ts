import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEvent, OutboxEventType } from '../entities/outbox-event.entity';
import { OutboxService } from '../services/outbox.service';
import { MoodleClientService } from '../../moodle-integration/moodle-client.service';
import { AuditService } from '../services/audit.service';

@Processor('outbox')
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>,
    private readonly outboxService: OutboxService,
    private readonly moodleClient: MoodleClientService,
    private readonly auditService: AuditService,
  ) {}

  @Process('process-event')
  async processEvent(job: Job<{ eventId: number }>) {
    const { eventId } = job.data;

    this.logger.log(`Processing outbox event ${eventId}`);

    const event = await this.outboxRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      this.logger.error(`Outbox event ${eventId} not found`);
      return;
    }

    await this.outboxService.markAsProcessing(eventId);

    try {
      await this.handleEvent(event);
      await this.outboxService.markAsSuccess(eventId);

      // Registrar en auditoría
      await this.auditService.log({
        action: 'outbox.processed',
        entity: 'outbox_event',
        entityKey: eventId.toString(),
        afterData: { eventType: event.eventType, payload: event.payload },
        source: 'sync',
      });
    } catch (error) {
      const attempts = event.attempts + 1;
      await this.outboxService.markAsFailed(eventId, error.message, attempts);

      throw error;
    }
  }

  private async handleEvent(event: OutboxEvent): Promise<void> {
    switch (event.eventType) {
      case OutboxEventType.GRADE_UPDATED:
        await this.handleGradeUpdated(event);
        break;

      case OutboxEventType.ENROLMENT_CREATED:
        await this.handleEnrolmentCreated(event);
        break;

      case OutboxEventType.ENROLMENT_UPDATED:
        await this.handleEnrolmentUpdated(event);
        break;

      case OutboxEventType.ENROLMENT_SUSPENDED:
        await this.handleEnrolmentSuspended(event);
        break;

      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }
  }

  private async handleGradeUpdated(event: OutboxEvent): Promise<void> {
    const { courseMoodleId, itemMoodleId, userMoodleId, grade, feedback } =
      event.payload;

    this.logger.log(
      `Updating grade in Moodle: course=${courseMoodleId}, item=${itemMoodleId}, user=${userMoodleId}`,
    );

    await this.moodleClient.updateGrade(
      courseMoodleId,
      itemMoodleId,
      userMoodleId,
      grade,
      feedback,
    );
  }

  private async handleEnrolmentCreated(event: OutboxEvent): Promise<void> {
    const { courseMoodleId, userMoodleId, roleId } = event.payload;

    this.logger.log(
      `Creating enrolment in Moodle: course=${courseMoodleId}, user=${userMoodleId}`,
    );

    await this.moodleClient.enrolUser(
      courseMoodleId,
      userMoodleId,
      roleId || 5,
    );
  }

  private async handleEnrolmentUpdated(event: OutboxEvent): Promise<void> {
    const { courseMoodleId, userMoodleId, roleId } = event.payload;

    this.logger.log(
      `Updating enrolment in Moodle: course=${courseMoodleId}, user=${userMoodleId}`,
    );

    // En Moodle, actualizar puede ser suspender y volver a matricular
    await this.moodleClient.enrolUser(
      courseMoodleId,
      userMoodleId,
      roleId || 5,
    );
  }

  private async handleEnrolmentSuspended(event: OutboxEvent): Promise<void> {
    const { courseMoodleId, userMoodleId } = event.payload;

    this.logger.log(
      `Suspending enrolment in Moodle: course=${courseMoodleId}, user=${userMoodleId}`,
    );

    await this.moodleClient.suspendEnrolment(courseMoodleId, userMoodleId);
  }
}
