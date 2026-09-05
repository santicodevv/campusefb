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

@Entity('sga_student_programs')
@Index(['userId', 'programId'], { unique: true })
export class StudentProgram {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', name: 'user_id' })
  @Index()
  userId: number;

  @Column({ type: 'bigint', name: 'program_id' })
  programId: number;

  @Column({ type: 'date', nullable: true, name: 'entry_date' })
  entryDate: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AcademicProgram, (ap) => ap.studentPrograms)
  @JoinColumn({ name: 'program_id' })
  program: AcademicProgram;
}
