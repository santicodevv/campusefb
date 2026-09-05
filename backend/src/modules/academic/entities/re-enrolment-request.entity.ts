import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AcademicPeriod } from './academic-period.entity';
import { ReEnrolmentLine } from './re-enrolment-line.entity';

export enum ReEnrolmentStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  APPLIED = 'applied',
}

@Entity('re_enrolment_requests')
export class ReEnrolmentRequest {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', name: 'app_user_id' })
  @Index()
  appUserId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_user_id' })
  student: User;

  @Column({ type: 'bigint', name: 'period_id' })
  @Index()
  periodId: number;

  @ManyToOne(() => AcademicPeriod)
  @JoinColumn({ name: 'period_id' })
  period: AcademicPeriod;

  @Column({
    type: 'varchar',
    length: 50,
    default: ReEnrolmentStatus.DRAFT,
  })
  @Index()
  status: ReEnrolmentStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'submitted_at' })
  submittedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'decided_at' })
  decidedAt: Date;

  @Column({ type: 'bigint', nullable: true, name: 'decided_by' })
  decidedBy: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'decided_by' })
  decider: User;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ReEnrolmentLine, (line) => line.request, {
    cascade: true,
  })
  lines: ReEnrolmentLine[];
}
