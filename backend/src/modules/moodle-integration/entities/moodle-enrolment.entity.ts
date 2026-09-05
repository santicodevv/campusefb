import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('moodle_enrolments')
@Index(['courseMoodleId', 'userMoodleId', 'roleCode'], { unique: true })
export class MoodleEnrolment {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', name: 'course_moodle_id' })
  @Index()
  courseMoodleId: number;

  @Column({ type: 'bigint', name: 'user_moodle_id' })
  @Index()
  userMoodleId: number;

  @Column({ type: 'varchar', length: 50, name: 'role_code' })
  @Index()
  roleCode: string; // student|teacher|editingteacher|etc

  @Column({ type: 'varchar', length: 50, name: 'enrol_status' })
  @Index()
  enrolStatus: string; // active|suspended

  @Column({ type: 'timestamptz', nullable: true })
  timestart: Date;

  @Column({ type: 'timestamptz', nullable: true })
  timeend: Date;

  @Column({ type: 'timestamptz', nullable: true })
  timemodified: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_course_access' })
  lastCourseAccess: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_synced_at' })
  lastSyncedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
