import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AcademicPeriod } from './academic-period.entity';

/**
 * CourseStudentGrade: Nota final del estudiante por curso
 *
 * Esta entidad almacena la nota final (totalGrade) que el profesor
 * asigna a cada estudiante en un curso, junto con un comentario.
 *
 * - Admin: Puede ver/editar todo (sumatoria de Moodle, items, totalGrade, comment)
 * - Profesor: Solo ve sumatoria (no editable) y edita totalGrade + comment
 * - Estudiante: Solo ve totalGrade + comment de sus cursos
 */
@Entity('course_student_grades')
@Unique(['courseMoodleId', 'studentId', 'periodId'])
@Index(['courseMoodleId', 'periodId'])
@Index(['studentId', 'periodId'])
export class CourseStudentGrade {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // Curso de Moodle
  @Column({ type: 'bigint', name: 'course_moodle_id' })
  @Index()
  courseMoodleId: number;

  // Cache del nombre del curso para mostrar
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'course_name' })
  courseName: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'course_shortname',
  })
  courseShortname: string | null;

  // Estudiante (app_user)
  @Column({ type: 'bigint', name: 'student_id' })
  @Index()
  studentId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'id' })
  student: User;

  // Período académico
  @Column({ type: 'bigint', name: 'period_id' })
  @Index()
  periodId: number;

  @ManyToOne(() => AcademicPeriod, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'period_id', referencedColumnName: 'id' })
  period: AcademicPeriod;

  // Profesor que asignó la nota
  @Column({ type: 'bigint', name: 'teacher_id' })
  teacherId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id', referencedColumnName: 'id' })
  teacher: User;

  // Sumatoria de Moodle (cache, solo lectura para profesor)
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'moodle_sum_grade',
  })
  moodleSumGrade: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'moodle_sum_max',
  })
  moodleSumMax: number | null;

  // Nota final asignada por el profesor
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'total_grade',
  })
  totalGrade: number | null;

  // Comentario del profesor
  @Column({ type: 'text', nullable: true })
  comment: string | null;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
