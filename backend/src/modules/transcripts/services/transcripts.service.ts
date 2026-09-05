import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Transcript, TranscriptStatus } from '../entities/transcript.entity';
import { User } from '../../users/entities/user.entity';
import { LocalGrade } from '../../academic/entities/local-grade.entity';
import { AcademicPeriod } from '../../academic/entities/academic-period.entity';
import {
  CreateTranscriptDto,
  RevokeTranscriptDto,
} from '../dto/create-transcript.dto';
import { TranscriptPdfService } from './transcript-pdf.service';

@Injectable()
export class TranscriptsService {
  private readonly storagePath: string;

  constructor(
    @InjectRepository(Transcript)
    private readonly transcriptRepository: Repository<Transcript>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LocalGrade)
    private readonly gradeRepository: Repository<LocalGrade>,
    @InjectRepository(AcademicPeriod)
    private readonly periodRepository: Repository<AcademicPeriod>,
    private readonly pdfService: TranscriptPdfService,
  ) {
    this.storagePath = path.join(process.cwd(), 'storage', 'transcripts');
    this.ensureStorageDir();
  }

  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch {
      // Ignorar si ya existe
    }
  }

  /**
   * Generar un nuevo transcript para un estudiante
   */
  async generate(
    createDto: CreateTranscriptDto,
    requestedBy: number,
  ): Promise<Transcript> {
    // Validar que el estudiante existe
    const student = await this.userRepository.findOne({
      where: { id: createDto.studentId },
      relations: ['roles'],
    });

    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    // Verificar que es un estudiante
    const isStudent = student.roles.some((r) => r.code === 'STUDENT');
    if (!isStudent) {
      throw new BadRequestException('El usuario no es un estudiante');
    }

    // Obtener períodos (todos si no se especifican)
    let periods: AcademicPeriod[];
    if (createDto.periodIds && createDto.periodIds.length > 0) {
      periods = await this.periodRepository.find({
        where: { id: In(createDto.periodIds) },
        order: { startDate: 'ASC' },
      });
    } else {
      periods = await this.periodRepository.find({
        order: { startDate: 'ASC' },
      });
    }

    if (periods.length === 0) {
      throw new BadRequestException('No hay períodos académicos disponibles');
    }

    // Obtener calificaciones del estudiante
    const grades = await this.gradeRepository
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.course', 'course')
      .leftJoinAndSelect('grade.gradeItem', 'gradeItem')
      .leftJoinAndSelect('grade.period', 'period')
      .where('grade.studentId = :studentId', { studentId: createDto.studentId })
      .andWhere('grade.periodId IN (:...periodIds)', {
        periodIds: periods.map((p) => p.id),
      })
      .orderBy('period.startDate', 'ASC')
      .addOrderBy('course.fullname', 'ASC')
      .getMany();

    if (grades.length === 0) {
      throw new BadRequestException(
        'No hay calificaciones para generar el transcript',
      );
    }

    // Preparar datos del transcript
    const periodsIncluded = periods.map((p) => ({
      periodId: p.id,
      periodCode: p.code,
      periodName: p.name,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
    }));

    // Agrupar calificaciones por curso
    const courseMap = new Map<
      number,
      {
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
      }
    >();

    for (const g of grades) {
      if (!courseMap.has(g.courseId)) {
        courseMap.set(g.courseId, {
          courseId: g.courseId,
          courseName: g.course.fullname,
          periodCode: g.period.code,
          gradeItems: [],
        });
      }

      const course = courseMap.get(g.courseId)!;
      const gradeMax = g.gradeItem.grademax || 100;
      const gradeMin = g.gradeItem.grademin || 0;
      const percentage =
        gradeMax !== gradeMin
          ? Math.round(
              ((Number(g.grade) - gradeMin) / (gradeMax - gradeMin)) * 10000,
            ) / 100
          : 100;

      course.gradeItems.push({
        itemId: g.gradeItemId,
        itemName: g.gradeItem.itemname,
        grade: Number(g.grade),
        gradeMax,
        percentage,
      });
    }

    // Calcular promedios por curso
    const gradesData = Array.from(courseMap.values()).map((course) => ({
      ...course,
      courseAverage:
        course.gradeItems.length > 0
          ? Math.round(
              (course.gradeItems.reduce((acc, g) => acc + g.percentage, 0) /
                course.gradeItems.length) *
                100,
            ) / 100
          : 0,
    }));

    // Resumen general
    const allPercentages = gradesData.flatMap((c) =>
      c.gradeItems.map((g) => g.percentage),
    );
    const overallAverage =
      allPercentages.length > 0
        ? Math.round(
            (allPercentages.reduce((a, b) => a + b, 0) /
              allPercentages.length) *
              100,
          ) / 100
        : 0;

    const summaryData = {
      totalCourses: gradesData.length,
      overallAverage,
      generatedAt: new Date().toISOString(),
    };

    // Generar número de transcript
    const transcriptNumber = await this.generateTranscriptNumber();

    // Crear datos del estudiante snapshot
    const studentData = {
      email: student.email,
      displayName: student.displayName || student.email,
      moodleUserId: student.moodleUserId,
    };

    // Generar hash de verificación
    const contentToHash = JSON.stringify({
      transcriptNumber,
      studentData,
      periodsIncluded,
      gradesData,
      summaryData,
    });
    const verificationHash = crypto
      .createHash('sha256')
      .update(contentToHash)
      .digest('hex');

    // Crear el transcript (sin el archivo todavía)
    const transcript = this.transcriptRepository.create({
      transcriptNumber,
      studentId: createDto.studentId,
      studentData,
      periodsIncluded,
      gradesData,
      summaryData,
      verificationHash,
      filePath: '', // Se actualiza después de generar el PDF
      status: TranscriptStatus.GENERATED,
      createdBy: requestedBy,
    });

    const saved = await this.transcriptRepository.save(transcript);

    // Generar PDF
    const pdfBuffer = await this.pdfService.generateTranscriptPdf(saved);

    // Guardar PDF
    const fileName = `${transcriptNumber}.pdf`;
    const filePath = path.join(this.storagePath, fileName);
    await fs.writeFile(filePath, pdfBuffer);

    // Actualizar ruta del archivo
    saved.filePath = filePath;
    saved.verificationUrl = `/transcripts/verify/${verificationHash}`;
    await this.transcriptRepository.save(saved);

    return saved;
  }

  /**
   * Obtener transcript por ID
   */
  async findOne(id: number): Promise<Transcript> {
    const transcript = await this.transcriptRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!transcript) {
      throw new NotFoundException('Transcript no encontrado');
    }

    return transcript;
  }

  /**
   * Obtener transcript por número
   */
  async findByNumber(transcriptNumber: string): Promise<Transcript> {
    const transcript = await this.transcriptRepository.findOne({
      where: { transcriptNumber },
      relations: ['student'],
    });

    if (!transcript) {
      throw new NotFoundException('Transcript no encontrado');
    }

    return transcript;
  }

  /**
   * Verificar transcript por hash
   */
  async verifyByHash(hash: string): Promise<{
    valid: boolean;
    transcript?: Partial<Transcript>;
    message: string;
  }> {
    const transcript = await this.transcriptRepository.findOne({
      where: { verificationHash: hash },
    });

    if (!transcript) {
      return {
        valid: false,
        message:
          'No se encontró ningún documento con este código de verificación',
      };
    }

    if (transcript.status === TranscriptStatus.REVOKED) {
      return {
        valid: false,
        transcript: {
          transcriptNumber: transcript.transcriptNumber,
          status: transcript.status,
          revokedAt: transcript.revokedAt,
          revocationReason: transcript.revocationReason,
        },
        message: 'Este documento ha sido revocado',
      };
    }

    return {
      valid: true,
      transcript: {
        transcriptNumber: transcript.transcriptNumber,
        studentData: transcript.studentData,
        summaryData: transcript.summaryData,
        createdAt: transcript.createdAt,
        status: transcript.status,
      },
      message: 'Documento válido y verificado',
    };
  }

  /**
   * Obtener transcripts de un estudiante
   */
  async findByStudent(studentId: number): Promise<Transcript[]> {
    return this.transcriptRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener todos los transcripts (admin)
   */
  async findAll(filters?: {
    status?: TranscriptStatus;
    studentId?: number;
  }): Promise<Transcript[]> {
    const query = this.transcriptRepository
      .createQueryBuilder('transcript')
      .leftJoinAndSelect('transcript.student', 'student');

    if (filters?.status) {
      query.andWhere('transcript.status = :status', { status: filters.status });
    }

    if (filters?.studentId) {
      query.andWhere('transcript.studentId = :studentId', {
        studentId: filters.studentId,
      });
    }

    query.orderBy('transcript.createdAt', 'DESC');

    return query.getMany();
  }

  /**
   * Revocar un transcript
   */
  async revoke(
    id: number,
    revokeDto: RevokeTranscriptDto,
    revokedBy: number,
  ): Promise<Transcript> {
    const transcript = await this.findOne(id);

    if (transcript.status === TranscriptStatus.REVOKED) {
      throw new BadRequestException('El transcript ya está revocado');
    }

    transcript.status = TranscriptStatus.REVOKED;
    transcript.revocationReason = revokeDto.reason || 'Sin razón especificada';
    transcript.revokedAt = new Date();
    transcript.revokedBy = revokedBy;

    return this.transcriptRepository.save(transcript);
  }

  /**
   * Obtener archivo PDF de un transcript
   */
  async getFile(id: number): Promise<Buffer> {
    const transcript = await this.findOne(id);

    if (transcript.status === TranscriptStatus.REVOKED) {
      throw new BadRequestException(
        'No se puede descargar un transcript revocado',
      );
    }

    try {
      const buffer = await fs.readFile(transcript.filePath);
      return buffer;
    } catch {
      throw new NotFoundException('Archivo PDF no encontrado');
    }
  }

  /**
   * Regenerar PDF de un transcript existente
   */
  async regeneratePdf(id: number): Promise<Transcript> {
    const transcript = await this.findOne(id);

    if (transcript.status === TranscriptStatus.REVOKED) {
      throw new BadRequestException(
        'No se puede regenerar un transcript revocado',
      );
    }

    // Regenerar PDF
    const pdfBuffer = await this.pdfService.generateTranscriptPdf(transcript);

    // Guardar PDF
    await fs.writeFile(transcript.filePath, pdfBuffer);

    return transcript;
  }

  /**
   * Generar número de transcript único
   */
  private async generateTranscriptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TRN-${year}-`;

    // Obtener el último número del año actual
    const lastTranscript = await this.transcriptRepository
      .createQueryBuilder('transcript')
      .where('transcript.transcriptNumber LIKE :prefix', {
        prefix: `${prefix}%`,
      })
      .orderBy('transcript.id', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastTranscript) {
      const lastNumberStr = lastTranscript.transcriptNumber.replace(prefix, '');
      nextNumber = parseInt(lastNumberStr, 10) + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }
}
