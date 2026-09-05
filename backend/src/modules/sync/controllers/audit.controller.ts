import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleCode } from '../../users/entities/role.entity';
import { AuditService } from '../services/audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(RoleCode.ADMIN)
  async findRecent(@Query('limit') limit?: number) {
    return this.auditService.findRecent(limit || 100);
  }

  @Get('by-entity')
  @Roles(RoleCode.ADMIN)
  async findByEntity(
    @Query('entity') entity: string,
    @Query('entityKey') entityKey: string,
  ) {
    return this.auditService.findByEntity(entity, entityKey);
  }

  @Get('by-user')
  @Roles(RoleCode.ADMIN)
  async findByUser(
    @Query('userId') userId: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findByUser(userId, limit);
  }
}
