import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

export enum SyncEntity {
  USERS = 'users',
  CATEGORIES = 'categories',
  COURSES = 'courses',
  ENROLMENTS = 'enrolments',
  GRADES = 'grades',
  GRADE_ITEMS = 'grade_items',
}

@Entity('sync_state')
export class SyncState {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  entity: SyncEntity;

  @Column({ type: 'text', nullable: true, name: 'last_checkpoint' })
  lastCheckpoint: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;
}
