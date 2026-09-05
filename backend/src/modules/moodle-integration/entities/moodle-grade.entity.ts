import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('moodle_grades')
@Index(['courseMoodleId', 'itemMoodleId', 'userMoodleId'], { unique: true })
export class MoodleGrade {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', name: 'course_moodle_id' })
  @Index()
  courseMoodleId: number;

  @Column({ type: 'bigint', name: 'item_moodle_id' })
  @Index()
  itemMoodleId: number;

  @Column({ type: 'bigint', name: 'user_moodle_id' })
  @Index()
  userMoodleId: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  grade: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'timestamptz', nullable: true })
  timemodified: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_synced_at' })
  lastSyncedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
