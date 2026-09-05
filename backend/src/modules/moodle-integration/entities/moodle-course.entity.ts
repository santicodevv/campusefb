import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('moodle_courses')
export class MoodleCourse {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', unique: true, name: 'moodle_id' })
  @Index()
  moodleId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shortname: string;

  @Column({ type: 'text', nullable: true })
  fullname: string;

  @Column({ type: 'bigint', nullable: true, name: 'category_id' })
  categoryId: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  idnumber: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'subject_name',
  })
  subjectName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  code: string;

  @Column({ type: 'boolean', default: true })
  visible: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  startdate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  enddate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  timemodified: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_synced_at' })
  lastSyncedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
