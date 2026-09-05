import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('moodle_grade_items')
@Index(['courseMoodleId', 'itemMoodleId'], { unique: true })
export class MoodleGradeItem {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', name: 'course_moodle_id' })
  @Index()
  courseMoodleId: number;

  @Column({ type: 'bigint', name: 'item_moodle_id' })
  itemMoodleId: number;

  @Column({ type: 'text', nullable: true })
  itemname: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  itemtype: string; // course|mod|manual|etc

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  grademax: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  grademin: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  weight: number;

  @Column({ type: 'timestamptz', nullable: true })
  timemodified: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_synced_at' })
  lastSyncedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
