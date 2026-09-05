import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GradeEditSession } from './grade-edit-session.entity';

@Entity('grade_edits')
@Index(['sessionId', 'courseMoodleId', 'itemMoodleId', 'studentMoodleId'], {
  unique: true,
})
export class GradeEdit {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', name: 'session_id' })
  sessionId: number;

  @Column({ type: 'int', name: 'teacher_user_id' })
  teacherUserId: number;

  @Column({ type: 'bigint', name: 'course_moodle_id' })
  @Index()
  courseMoodleId: number;

  @Column({ type: 'bigint', name: 'item_moodle_id' })
  itemMoodleId: number;

  @Column({ type: 'bigint', name: 'student_moodle_id' })
  studentMoodleId: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    name: 'previous_grade',
  })
  previousGrade: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, name: 'new_grade' })
  newGrade: number;

  @Column({ type: 'text', nullable: true })
  feedback: string | null;

  @ManyToOne(() => GradeEditSession)
  @JoinColumn({ name: 'session_id' })
  session: GradeEditSession;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
