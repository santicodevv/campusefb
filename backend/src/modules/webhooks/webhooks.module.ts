import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MoodleWebhookController } from './moodle-webhook.controller';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [SyncModule, BullModule.registerQueue({ name: 'moodle-inbound' })],
  controllers: [MoodleWebhookController],
})
export class WebhooksModule {}
