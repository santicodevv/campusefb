import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleCode } from '../../users/entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncState, SyncEntity } from '../entities/sync-state.entity';
import { SyncSchedulerService } from '../services/sync-scheduler.service';
import { MoodleSyncService } from '../../moodle-integration/moodle-sync.service';

@Controller('sync')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(
    @InjectRepository(SyncState)
    private readonly syncStateRepository: Repository<SyncState>,
    private readonly syncSchedulerService: SyncSchedulerService,
    private readonly moodleSyncService: MoodleSyncService,
  ) {}

  @Get('status')
  @Roles(RoleCode.ADMIN)
  async getStatus() {
    try {
      const states = await this.syncStateRepository.find({
        order: { updatedAt: 'DESC' },
      });

      return {
        states,
        isRunning: false,
      };
    } catch (error) {
      this.logger.error(`Error getting sync status: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener el estado de sincronización',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('trigger')
  @Roles(RoleCode.ADMIN)
  triggerSync() {
    this.logger.log('Triggering full sync in background...');

    // Fire-and-forget: no esperamos a que termine para evitar timeout de HTTP
    this.syncSchedulerService.forceSync().catch((error) => {
      this.logger.error(`Background full sync failed: ${error.message}`);
    });

    return {
      success: true,
      message: 'Sincronización completa iniciada en segundo plano',
    };
  }

  @Post('trigger/:entity')
  @Roles(RoleCode.ADMIN)
  triggerEntitySync(@Param('entity') entity: string) {
    // Entity values in enum are lowercase (users, courses, etc.)
    const syncEntity = entity.toLowerCase() as SyncEntity;

    // Validate entity first (before launching background task)
    const validEntities = Object.values(SyncEntity);
    if (!validEntities.includes(syncEntity)) {
      throw new HttpException(
        {
          success: false,
          message: `Entidad inválida: ${entity}. Entidades válidas: ${validEntities.join(', ')}`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(
      `Triggering sync for entity: ${syncEntity} in background...`,
    );

    // Fire-and-forget
    this.syncSchedulerService.forceSync(syncEntity).catch((error) => {
      this.logger.error(`Background ${entity} sync failed: ${error.message}`);
    });

    return {
      success: true,
      message: `Sincronización de ${entity} iniciada en segundo plano`,
    };
  }

  // Alias routes for frontend compatibility
  @Post('force')
  @Roles(RoleCode.ADMIN)
  forceSync() {
    return this.triggerSync();
  }

  @Post('force/:entity')
  @Roles(RoleCode.ADMIN)
  forceEntitySync(@Param('entity') entity: string) {
    return this.triggerEntitySync(entity);
  }

  /**
   * Fix teacher assignments: roles in app_users and course_teachers records
   * POST /sync/fix-teachers
   */
  @Post('fix-teachers')
  @Roles(RoleCode.ADMIN)
  async fixTeachers() {
    try {
      this.logger.log('Fixing teacher assignments...');

      // Fix teacher roles in app_users
      const rolesFixed = await this.moodleSyncService.fixTeacherRoles();

      // Fix course_teachers records
      const courseTeachersFixed =
        await this.moodleSyncService.fixCourseTeachers();

      return {
        success: true,
        message: 'Asignación de profesores corregida correctamente',
        results: {
          teacherRolesAssigned: rolesFixed,
          courseTeachersCreated: courseTeachersFixed,
        },
      };
    } catch (error) {
      this.logger.error(`Error fixing teachers: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Error al corregir asignación de profesores',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
