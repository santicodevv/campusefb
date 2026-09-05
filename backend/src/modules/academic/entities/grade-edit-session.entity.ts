import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('grade_edit_sessions')
export class GradeEditSession {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'boolean', default: false, name: 'is_active' })
  @Index()
  isActive: boolean;

  @Column({ type: 'int', name: 'activated_by' })
  activatedBy: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'activated_at' })
  activatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'deactivated_at' })
  deactivatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
