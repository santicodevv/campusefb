import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MoodleCourse } from '../../moodle-integration/entities/moodle-course.entity';
import { MoodleGradeItem } from '../../moodle-integration/entities/moodle-grade-item.entity';
import { User } from '../../users/entities/user.entity';
import { AcademicPeriod } from './academic-period.entity';

/**
 * LocalGrade: Captura local de calificaciones
 *
 * Esta entidad representa las calificaciones capturadas localmente
 * por profesores antes de ser sincronizadas a Moodle.
 *
 * Workflow:
 * 1. Profesor captura calificación → se guarda en local_grades
 * 2. Se valida (rango, período abierto, profesor asignado)
 * 3. Se crea evento en outbox_events para sincronizar a Moodle
 * 4. OutboxProcessor procesa el evento y actualiza Moodle
 * 5. Webhook de Moodle actualiza moodle_grades (mirror)
 */
@Entity('local_grades')
@Index(['courseId', 'gradeItemId', 'studentId'], { unique: true })
export class LocalGrade {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // Relación con curso de Moodle
  @Column({ type: 'bigint', name: 'course_id' })
  courseId: number;

  @ManyToOne(() => MoodleCourse, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id', referencedColumnName: 'id' })
  course: MoodleCourse;

  // Relación con item de calificación
  @Column({ type: 'bigint', name: 'grade_item_id' })
  gradeItemId: number;

  @ManyToOne(() => MoodleGradeItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grade_item_id', referencedColumnName: 'id' })
  gradeItem: MoodleGradeItem;

  // Relación con estudiante (app_user)
  @Column({ type: 'bigint', name: 'student_id' })
  studentId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'id' })
  student: User;

  // Relación con profesor que capturó la calificación
  @Column({ type: 'bigint', name: 'teacher_id' })
  teacherId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id', referencedColumnName: 'id' })
  teacher: User;

  // Relación con período académico
  @Column({ type: 'bigint', name: 'period_id' })
  periodId: number;

  @ManyToOne(() => AcademicPeriod)
  @JoinColumn({ name: 'period_id', referencedColumnName: 'id' })
  period: AcademicPeriod;

  // Datos de la calificación
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  grade: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  // Estado de sincronización
  @Column({ type: 'boolean', default: false, name: 'synced_to_moodle' })
  syncedToMoodle: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'synced_at' })
  syncedAt: Date;

  @Column({ type: 'bigint', nullable: true, name: 'outbox_event_id' })
  outboxEventId: number;

  // Auditoría
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'bigint', nullable: true, name: 'created_by' })
  createdBy: number;

  @Column({ type: 'bigint', nullable: true, name: 'updated_by' })
  updatedBy: number;
}
