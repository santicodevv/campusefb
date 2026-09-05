import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { AcademicPeriod } from './academic-period.entity';

@Entity('period_available_courses')
@Unique(['periodId', 'courseMoodleId'])
export class PeriodAvailableCourse {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', name: 'period_id' })
  @Index()
  periodId: number;

  @ManyToOne(() => AcademicPeriod, (period) => period.availableCourses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'period_id' })
  period: AcademicPeriod;

  @Column({ type: 'bigint', name: 'course_moodle_id' })
  @Index()
  courseMoodleId: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'course_name' })
  courseName: string | null; // Cache del nombre del curso

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'course_shortname',
  })
  courseShortname: string | null; // Cache del shortname

  @Column({ type: 'bigint', nullable: true, name: 'category_moodle_id' })
  categoryMoodleId: number | null; // Categoría del curso en Moodle

  @Column({ type: 'boolean', default: true })
  enabled: boolean; // Si el curso está habilitado para reinscripción

  @Column({ type: 'int', nullable: true, name: 'max_students' })
  maxStudents: number | null; // Límite de estudiantes (opcional)

  @Column({ type: 'int', default: 0, name: 'enrolled_count' })
  enrolledCount: number; // Contador de inscritos

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
