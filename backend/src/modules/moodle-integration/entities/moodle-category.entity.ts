import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('moodle_categories')
export class MoodleCategory {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', unique: true, name: 'moodle_id' })
  @Index()
  moodleId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'bigint', nullable: true })
  parent: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  depth: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  path: string;

  @Column({ type: 'int', default: 0 })
  coursecount: number;

  @Column({ type: 'boolean', default: true })
  visible: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  timemodified: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_synced_at' })
  lastSyncedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
