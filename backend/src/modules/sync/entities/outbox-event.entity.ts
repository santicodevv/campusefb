import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OutboxEventType {
  GRADE_UPDATED = 'grade.updated',
  ENROLMENT_CREATED = 'enrolment.created',
  ENROLMENT_UPDATED = 'enrolment.updated',
  ENROLMENT_SUSPENDED = 'enrolment.suspended',
}

export enum OutboxEventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DONE = 'done',
  FAILED = 'failed',
}

@Entity('outbox_events')
export class OutboxEvent {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100, name: 'event_type' })
  @Index()
  eventType: OutboxEventType;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({
    type: 'varchar',
    length: 50,
    default: OutboxEventStatus.PENDING,
  })
  @Index()
  status: OutboxEventStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'timestamptz', name: 'next_attempt_at' })
  @Index()
  nextAttemptAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'text', nullable: true, name: 'last_error' })
  lastError: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'processed_at' })
  processedAt: Date;
}
