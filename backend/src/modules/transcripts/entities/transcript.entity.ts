import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Estados del transcript
 */
export enum TranscriptStatus {
  GENERATED = 'generated',
  REVOKED = 'revoked',
}

/**
 * Transcript: Récord académico oficial
 *
 * Representa un documento oficial de récord académico generado
 * para un estudiante. Incluye:
 * - Hash SHA-256 para verificación de integridad
 * - QR code con URL de verificación
 * - Almacenamiento del archivo PDF
 */
@Entity('transcripts')
@Index(['transcriptNumber'], { unique: true })
@Index(['verificationHash'], { unique: true })
@Index(['studentId'])
export class Transcript {
  @PrimaryGeneratedColumn('increment')
  id: number;

  /**
   * Número único del transcript (formato: TRN-YYYY-NNNNNN)
   */
  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    name: 'transcript_number',
  })
  transcriptNumber: string;

  /**
   * Relación con el estudiante
   */
  @Column({ type: 'bigint', name: 'student_id' })
  studentId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'id' })
  student: User;

  /**
   * Datos del estudiante al momento de generar (snapshot)
   */
  @Column({ type: 'jsonb', name: 'student_data' })
  studentData: {
    email: string;
    displayName: string;
    moodleUserId?: number;
  };

  /**
   * Períodos incluidos en el transcript
   */
  @Column({ type: 'jsonb', name: 'periods_included' })
  periodsIncluded: {
    periodId: number;
    periodCode: string;
    periodName: string;
    startDate: string;
    endDate: string;
  }[];

  /**
   * Cursos y calificaciones incluidas
   */
  @Column({ type: 'jsonb', name: 'grades_data' })
  gradesData: {
    courseId: number;
    courseName: string;
    periodCode: string;
    gradeItems: {
      itemId: number;
      itemName: string;
      grade: number;
      gradeMax: number;
      percentage: number;
    }[];
    courseAverage: number;
  }[];

  /**
   * Resumen académico
   */
  @Column({ type: 'jsonb', name: 'summary_data' })
  summaryData: {
    totalCourses: number;
    totalCredits?: number;
    overallAverage: number;
    generatedAt: string;
  };

  /**
   * Hash SHA-256 del contenido para verificación
   */
  @Column({
    type: 'varchar',
    length: 64,
    unique: true,
    name: 'verification_hash',
  })
  verificationHash: string;

  /**
   * Ruta del archivo PDF almacenado
   */
  @Column({ type: 'text', name: 'file_path' })
  filePath: string;

  /**
   * URL pública para verificación (si aplica)
   */
  @Column({ type: 'text', nullable: true, name: 'verification_url' })
  verificationUrl: string;

  /**
   * Estado del transcript
   */
  @Column({
    type: 'enum',
    enum: TranscriptStatus,
    default: TranscriptStatus.GENERATED,
  })
  status: TranscriptStatus;

  /**
   * Razón de revocación (si aplica)
   */
  @Column({ type: 'text', nullable: true, name: 'revocation_reason' })
  revocationReason: string;

  /**
   * Fecha de revocación (si aplica)
   */
  @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
  revokedAt: Date;

  /**
   * Usuario que revocó (si aplica)
   */
  @Column({ type: 'bigint', nullable: true, name: 'revoked_by' })
  revokedBy: number;

  /**
   * Metadata adicional
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  /**
   * Auditoría
   */
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'bigint', name: 'created_by' })
  createdBy: number;
}
