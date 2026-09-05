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
import { User } from '../../users/entities/user.entity';

@Entity('course_teachers')
@Unique(['courseMoodleId', 'teacherId'])
@Index(['courseMoodleId'])
@Index(['teacherId'])
export class CourseTeacher {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', name: 'course_moodle_id' })
  courseMoodleId: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'course_name' })
  courseName: string | null;

  @Column({ type: 'bigint', name: 'teacher_id' })
  teacherId: number;

  @Column({ type: 'boolean', default: true, name: 'is_primary' })
  isPrimary: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;
}
