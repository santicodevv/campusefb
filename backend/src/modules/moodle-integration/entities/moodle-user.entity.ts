import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('moodle_users')
export class MoodleUser {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', unique: true, name: 'moodle_id' })
  @Index()
  moodleId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstname: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastname: string;

  @Column({ type: 'varchar', length: 50, name: 'user_type' })
  userType: string; // student|teacher|other

  @Column({ type: 'boolean', default: false })
  suspended: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  timemodified: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_access' })
  lastAccess: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_synced_at' })
  lastSyncedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
