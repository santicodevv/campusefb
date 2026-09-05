import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { StudyPlan } from './study-plan.entity';
import { StudentProgram } from './student-program.entity';

@Entity('sga_programs')
export class AcademicProgram {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'bigint',
    nullable: true,
    unique: true,
    name: 'moodle_category_id',
  })
  moodleCategoryId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => StudyPlan, (sp) => sp.program)
  studyPlans: StudyPlan[];

  @OneToMany(() => StudentProgram, (sp) => sp.program)
  studentPrograms: StudentProgram[];
}
