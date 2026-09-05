import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AcademicProgram } from './academic-program.entity';

@Entity('sga_study_plans')
@Index(['programId', 'courseMoodleId'], { unique: true })
export class StudyPlan {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', name: 'program_id' })
  @Index()
  programId: number;

  @Column({ type: 'bigint', name: 'course_moodle_id' })
  courseMoodleId: number;

  @Column({ type: 'int' })
  @Index()
  level: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AcademicProgram, (ap) => ap.studyPlans)
  @JoinColumn({ name: 'program_id' })
  program: AcademicProgram;
}
