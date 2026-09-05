import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { MoodleIntegrationModule } from '../moodle-integration/moodle-integration.module';

// Entities
import { Role } from '../users/entities/role.entity';
import { OutboxEvent } from './entities/outbox-event.entity';
import { SyncState } from './entities/sync-state.entity';
import { AuditLog } from './entities/audit-log.entity';
import { MoodleGradeItem } from '../moodle-integration/entities/moodle-grade-item.entity';
import { MoodleCategory } from '../moodle-integration/entities/moodle-category.entity';

// Commands
import { SyncMoodleCommand } from './commands/sync-moodle.command';
import { SeedRolesCommand } from './commands/seed-roles.command';

// Services
import { OutboxService } from './services/outbox.service';
import { AuditService } from './services/audit.service';
import { SyncSchedulerService } from './services/sync-scheduler.service';

// Processors
import { OutboxProcessor } from './processors/outbox.processor';
import { MoodleInboundProcessor } from './processors/moodle-inbound.processor';

// Controllers
import { AuditController } from './controllers/audit.controller';
import { SyncController } from './controllers/sync.controller';
import { IntegrationController } from './controllers/integration.controller';

@Module({
  imports: [
    MoodleIntegrationModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Role,
      OutboxEvent,
      SyncState,
      AuditLog,
      MoodleGradeItem,
      MoodleCategory,
    ]),
    BullModule.registerQueue({ name: 'outbox' }, { name: 'moodle-inbound' }),
  ],
  controllers: [AuditController, SyncController, IntegrationController],
  providers: [
    // Commands
    SyncMoodleCommand,
    SeedRolesCommand,
    // Services
    OutboxService,
    AuditService,
    SyncSchedulerService,
    // Processors
    OutboxProcessor,
    MoodleInboundProcessor,
  ],
  exports: [OutboxService, AuditService, SyncSchedulerService],
})
export class SyncModule {}
