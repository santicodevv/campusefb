import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ReEnrolmentRequest } from './re-enrolment-request.entity';

export enum EnrolmentAction {
  ENROL = 'enrol',
  SUSPEND = 'suspend',
  UNENROL = 'unenrol',
}

export enum EnrolmentLineStatus {
  PENDING = 'pending',
  DONE = 'done',
  FAILED = 'failed',
}

@Entity('re_enrolment_lines')
@Unique(['requestId', 'courseMoodleId'])
export class ReEnrolmentLine {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', name: 'request_id' })
  @Index()
  requestId: number;

  @ManyToOne(() => ReEnrolmentRequest, (request) => request.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'request_id' })
  request: ReEnrolmentRequest;

  @Column({ type: 'bigint', name: 'course_moodle_id' })
  @Index()
  courseMoodleId: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'course_name' })
  courseName: string | null;

  @Column({ type: 'varchar', length: 50 })
  action: EnrolmentAction;

  @Column({
    type: 'varchar',
    length: 50,
    default: EnrolmentLineStatus.PENDING,
  })
  status: EnrolmentLineStatus;

  @Column({ type: 'text', nullable: true, name: 'last_error' })
  lastError: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'applied_at' })
  appliedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
