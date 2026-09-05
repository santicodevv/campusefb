import { Command, CommandRunner } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { MoodleSyncService } from '../../moodle-integration/moodle-sync.service';

@Command({
  name: 'sync:moodle',
  description: 'Sincronizar datos desde Moodle (bootstrap inicial)',
})
export class SyncMoodleCommand extends CommandRunner {
  private readonly logger = new Logger(SyncMoodleCommand.name);

  constructor(private readonly moodleSyncService: MoodleSyncService) {
    super();
  }

  async run(): Promise<void> {
    this.logger.log('🚀 Iniciando sincronización con Moodle...');

    try {
      await this.moodleSyncService.syncAll();
      this.logger.log('✅ Sincronización completada exitosamente!');
    } catch (error) {
      this.logger.error('❌ Error en sincronización:', error.message);
      throw error;
    }
  }
}
