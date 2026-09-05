import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  OutboxEvent,
  OutboxEventType,
  OutboxEventStatus,
} from '../entities/outbox-event.entity';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>,
    @InjectQueue('outbox')
    private readonly outboxQueue: Queue,
  ) {}

  async createEvent(
    eventType: OutboxEventType,
    payload: any,
  ): Promise<OutboxEvent> {
    const event = this.outboxRepository.create({
      eventType,
      payload,
      status: OutboxEventStatus.PENDING,
      attempts: 0,
      nextAttemptAt: new Date(),
    });

    const savedEvent = await this.outboxRepository.save(event);

    // Encolar para procesamiento
    await this.outboxQueue.add('process-event', { eventId: savedEvent.id });

    this.logger.log(
      `Outbox event created: ${eventType} (ID: ${savedEvent.id})`,
    );

    return savedEvent;
  }

  async getPendingEvents(limit: number = 100): Promise<OutboxEvent[]> {
    return this.outboxRepository.find({
      where: {
        status: OutboxEventStatus.PENDING,
        nextAttemptAt: LessThanOrEqual(new Date()),
      },
      take: limit,
      order: { createdAt: 'ASC' },
    });
  }

  async markAsProcessing(eventId: number): Promise<void> {
    await this.outboxRepository.update(eventId, {
      status: OutboxEventStatus.PROCESSING,
    });
  }

  async markAsSuccess(eventId: number): Promise<void> {
    await this.outboxRepository.update(eventId, {
      status: OutboxEventStatus.DONE,
      processedAt: new Date(),
      lastError: undefined,
    });

    this.logger.log(`Outbox event ${eventId} processed successfully`);
  }

  async markAsFailed(
    eventId: number,
    error: string,
    attempts: number,
  ): Promise<void> {
    // Backoff exponencial: 2^attempts minutos
    const backoffMinutes = Math.pow(2, attempts);
    const nextAttempt = new Date();
    nextAttempt.setMinutes(nextAttempt.getMinutes() + backoffMinutes);

    const status =
      attempts >= 5 ? OutboxEventStatus.FAILED : OutboxEventStatus.PENDING;

    await this.outboxRepository.update(eventId, {
      status,
      attempts,
      lastError: error,
      nextAttemptAt: nextAttempt,
    });

    if (status === OutboxEventStatus.FAILED) {
      this.logger.error(
        `Outbox event ${eventId} failed permanently after ${attempts} attempts`,
      );
    } else {
      this.logger.warn(
        `Outbox event ${eventId} failed (attempt ${attempts}), will retry at ${nextAttempt}`,
      );
    }
  }

  async getFailedEvents(): Promise<OutboxEvent[]> {
    return this.outboxRepository.find({
      where: { status: OutboxEventStatus.FAILED },
      order: { createdAt: 'DESC' },
    });
  }

  async retryEvent(eventId: number): Promise<void> {
    await this.outboxRepository.update(eventId, {
      status: OutboxEventStatus.PENDING,
      attempts: 0,
      nextAttemptAt: new Date(),
      lastError: undefined,
    });

    await this.outboxQueue.add('process-event', { eventId });

    this.logger.log(`Outbox event ${eventId} queued for retry`);
  }
}
