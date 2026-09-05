import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncState, SyncEntity } from '../entities/sync-state.entity';
import { MoodleSyncService } from '../../moodle-integration/moodle-sync.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SyncSchedulerService {
  private readonly logger = new Logger(SyncSchedulerService.name);
  private readonly isSchedulingEnabled: boolean;

  constructor(
    @InjectRepository(SyncState)
    private readonly syncStateRepository: Repository<SyncState>,
    private readonly moodleSyncService: MoodleSyncService,
    private readonly configService: ConfigService,
  ) {
    this.isSchedulingEnabled =
      this.configService.get<string>('NODE_ENV') !== 'test';
  }

  // Polling incremental cada hora
  @Cron(CronExpression.EVERY_HOUR)
  async incrementalSync() {
    if (!this.isSchedulingEnabled) return;

    this.logger.log('Starting incremental sync...');

    try {
      await this.syncUsersIncremental();
      await this.syncCategoriesIncremental();
      await this.syncCoursesIncremental();
      await this.syncEnrolmentsIncremental();
      await this.syncGradeItemsIncremental();
      await this.syncGradesIncremental();

      this.logger.log('Incremental sync completed');
    } catch (error) {
      this.logger.error(`Incremental sync failed: ${error.message}`);
    }
  }

  // Reconciliación completa diaria (a las 2 AM)
  @Cron('0 2 * * *')
  async dailyReconciliation() {
    if (!this.isSchedulingEnabled) return;

    this.logger.log('Starting daily reconciliation...');

    try {
      await this.moodleSyncService.syncAll();

      this.logger.log('Daily reconciliation completed');
    } catch (error) {
      this.logger.error(`Daily reconciliation failed: ${error.message}`);
    }
  }

  private async syncUsersIncremental() {
    const state = await this.getSyncState(SyncEntity.USERS);
    const sinceTimestamp = state?.lastCheckpoint
      ? parseInt(state.lastCheckpoint)
      : undefined;

    this.logger.log(
      `Syncing users modified since: ${sinceTimestamp ? new Date(sinceTimestamp * 1000).toISOString() : 'beginning'}`,
    );

    // Pass the timestamp to filter users modified since last sync
    await this.moodleSyncService.syncUsers(sinceTimestamp);

    // Actualizar checkpoint con timestamp actual
    await this.updateSyncState(
      SyncEntity.USERS,
      Math.floor(Date.now() / 1000).toString(),
    );
  }

  private async syncCategoriesIncremental() {
    this.logger.log('Syncing categories...');

    await this.moodleSyncService.syncCategories();

    await this.updateSyncState(
      SyncEntity.CATEGORIES,
      Math.floor(Date.now() / 1000).toString(),
    );
  }

  private async syncCoursesIncremental() {
    const state = await this.getSyncState(SyncEntity.COURSES);
    const sinceTimestamp = state?.lastCheckpoint
      ? parseInt(state.lastCheckpoint)
      : undefined;

    this.logger.log(
      `Syncing courses modified since: ${sinceTimestamp ? new Date(sinceTimestamp * 1000).toISOString() : 'beginning'}`,
    );

    await this.moodleSyncService.syncCourses(sinceTimestamp);

    await this.updateSyncState(
      SyncEntity.COURSES,
      Math.floor(Date.now() / 1000).toString(),
    );
  }

  private async syncEnrolmentsIncremental() {
    const state = await this.getSyncState(SyncEntity.ENROLMENTS);
    const sinceTimestamp = state?.lastCheckpoint
      ? parseInt(state.lastCheckpoint)
      : undefined;

    this.logger.log(
      `Syncing enrolments modified since: ${sinceTimestamp ? new Date(sinceTimestamp * 1000).toISOString() : 'beginning'}`,
    );

    // Enrolments don't have timemodified in Moodle API, so we do full sync
    // but we still update the checkpoint for tracking
    await this.moodleSyncService.syncAllEnrolments();

    await this.updateSyncState(
      SyncEntity.ENROLMENTS,
      Math.floor(Date.now() / 1000).toString(),
    );
  }

  private async syncGradeItemsIncremental() {
    const state = await this.getSyncState(SyncEntity.GRADE_ITEMS);
    const sinceTimestamp = state?.lastCheckpoint
      ? parseInt(state.lastCheckpoint)
      : undefined;

    this.logger.log(
      `Syncing grade items modified since: ${sinceTimestamp ? new Date(sinceTimestamp * 1000).toISOString() : 'beginning'}`,
    );

    // Grade items typically don't change often, do full sync
    await this.moodleSyncService.syncAllGradeItems();

    await this.updateSyncState(
      SyncEntity.GRADE_ITEMS,
      Math.floor(Date.now() / 1000).toString(),
    );
  }

  private async syncGradesIncremental() {
    const state = await this.getSyncState(SyncEntity.GRADES);
    const sinceTimestamp = state?.lastCheckpoint
      ? parseInt(state.lastCheckpoint)
      : undefined;

    this.logger.log(
      `Syncing grades modified since: ${sinceTimestamp ? new Date(sinceTimestamp * 1000).toISOString() : 'beginning'}`,
    );

    // Pass the timestamp to filter grades modified since last sync
    await this.moodleSyncService.syncAllGrades(sinceTimestamp);

    await this.updateSyncState(
      SyncEntity.GRADES,
      Math.floor(Date.now() / 1000).toString(),
    );
  }

  private async getSyncState(entity: SyncEntity): Promise<SyncState | null> {
    return this.syncStateRepository.findOne({ where: { entity } });
  }

  private async updateSyncState(
    entity: SyncEntity,
    checkpoint: string,
  ): Promise<void> {
    const existing = await this.getSyncState(entity);

    if (existing) {
      await this.syncStateRepository.update(existing.id, {
        lastCheckpoint: checkpoint,
      });
    } else {
      await this.syncStateRepository.save({
        entity,
        lastCheckpoint: checkpoint,
      });
    }
  }

  async forceSync(entity?: SyncEntity): Promise<void> {
    if (entity) {
      this.logger.log(`Force syncing ${entity}...`);

      switch (entity) {
        case SyncEntity.USERS:
          await this.moodleSyncService.syncUsers();
          break;
        case SyncEntity.CATEGORIES:
          await this.syncCategoriesIncremental();
          break;
        case SyncEntity.COURSES:
          await this.moodleSyncService.syncCourses();
          break;
        case SyncEntity.ENROLMENTS:
          await this.moodleSyncService.syncAllEnrolments();
          break;
        case SyncEntity.GRADE_ITEMS:
          await this.moodleSyncService.syncAllGradeItems();
          break;
        case SyncEntity.GRADES:
          await this.moodleSyncService.syncAllGrades();
          break;
        default:
          throw new Error(`Unknown entity: ${entity}`);
      }
    } else {
      this.logger.log('Force syncing all entities...');
      await this.moodleSyncService.syncAll();
    }
  }
}
