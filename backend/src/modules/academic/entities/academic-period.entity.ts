import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ReEnrolmentRequest } from './re-enrolment-request.entity';
import { PeriodAvailableCourse } from './period-available-course.entity';

export enum AcademicPeriodStatus {
  PLANNED = 'planned',
  OPEN = 'open',
  CLOSED = 'closed',
}

@Entity('academic_periods')
@Index(['reenrolmentOpen', 'reenrolmentStartDate', 'reenrolmentEndDate'])
export class AcademicPeriod {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  code: string; // 2024-1, 2024-Q1, etc.

  @Column({ type: 'varchar', length: 255 })
  name: string; // Primer Cuatrimestre 2024

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: AcademicPeriodStatus.PLANNED,
  })
  @Index()
  status: AcademicPeriodStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Información adicional

  // Campos para reinscripción
  @Column({ type: 'date', nullable: true, name: 'reenrolment_start_date' })
  reenrolmentStartDate: Date | null;

  @Column({ type: 'date', nullable: true, name: 'reenrolment_end_date' })
  reenrolmentEndDate: Date | null;

  @Column({ type: 'boolean', default: false, name: 'reenrolment_open' })
  reenrolmentOpen: boolean;

  @Column({ type: 'bigint', nullable: true, name: 'moodle_category_id' })
  moodleCategoryId: number | null; // Categoría de Moodle asociada al período

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ReEnrolmentRequest, (request) => request.period)
  reEnrolmentRequests: ReEnrolmentRequest[];

  @OneToMany(() => PeriodAvailableCourse, (course) => course.period)
  availableCourses: PeriodAvailableCourse[];
}
