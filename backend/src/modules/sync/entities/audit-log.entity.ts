import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', nullable: true, name: 'actor_user_id' })
  @Index()
  actorUserId: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actor: User;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  action: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  entity: string;

  @Column({ type: 'text', name: 'entity_key' })
  entityKey: string;

  @Column({ type: 'jsonb', nullable: true, name: 'before_data' })
  beforeData: any;

  @Column({ type: 'jsonb', nullable: true, name: 'after_data' })
  afterData: any;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string; // 'app' | 'moodle' | 'sync'
}
