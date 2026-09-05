import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

export interface CreateAuditLogDto {
  actorUserId?: number;
  action: string;
  entity: string;
  entityKey: string;
  beforeData?: any;
  afterData?: any;
  source?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(data: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditRepository.create({
      actorUserId: data.actorUserId,
      action: data.action,
      entity: data.entity,
      entityKey: data.entityKey,
      beforeData: data.beforeData,
      afterData: data.afterData,
      source: data.source || 'app',
    });

    const saved = await this.auditRepository.save(auditLog);

    this.logger.debug(
      `Audit log created: ${data.action} on ${data.entity}:${data.entityKey}`,
    );

    return saved;
  }

  async findByEntity(entity: string, entityKey: string): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: { entity, entityKey },
      order: { createdAt: 'DESC' },
      relations: ['actor'],
    });
  }

  async findByUser(userId: number, limit: number = 50): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: { actorUserId: userId },
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['actor'],
    });
  }

  async findRecent(limit: number = 100): Promise<AuditLog[]> {
    return this.auditRepository.find({
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['actor'],
    });
  }
}
