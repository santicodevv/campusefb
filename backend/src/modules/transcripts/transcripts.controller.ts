import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../users/entities/role.entity';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TranscriptsService } from './services/transcripts.service';
import {
  CreateTranscriptDto,
  RevokeTranscriptDto,
} from './dto/create-transcript.dto';
import { TranscriptStatus } from './entities/transcript.entity';

@Controller('transcripts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TranscriptsController {
  constructor(private readonly transcriptsService: TranscriptsService) {}

  /**
   * POST /transcripts
   * Generar un nuevo transcript para un estudiante
   * Roles: ADMIN
   */
  @Post()
  @Roles(RoleCode.ADMIN)
  async generate(
    @Body() createDto: CreateTranscriptDto,
    @CurrentUser() user: any,
  ) {
    return this.transcriptsService.generate(createDto, user.id);
  }

  /**
   * GET /transcripts
   * Listar todos los transcripts (con filtros)
   * Roles: ADMIN
   */
  @Get()
  @Roles(RoleCode.ADMIN)
  async findAll(
    @Query('status') status?: TranscriptStatus,
    @Query('studentId') studentId?: string,
  ) {
    return this.transcriptsService.findAll({
      status,
      studentId: studentId ? parseInt(studentId, 10) : undefined,
    });
  }

  /**
   * GET /transcripts/my-transcripts
   * Obtener transcripts del estudiante autenticado
   * Roles: STUDENT
   */
  @Get('my-transcripts')
  @Roles(RoleCode.STUDENT, RoleCode.TEACHER, RoleCode.ADMIN)
  async getMyTranscripts(@CurrentUser() user: any) {
    return this.transcriptsService.findByStudent(user.id);
  }

  /**
   * GET /transcripts/verify/:hash
   * Verificar autenticidad de un transcript por hash
   * Endpoint PÚBLICO (no requiere autenticación)
   */
  @Get('verify/:hash')
  @Public()
  async verifyByHash(@Param('hash') hash: string) {
    return this.transcriptsService.verifyByHash(hash);
  }

  /**
   * GET /transcripts/by-number/:number
   * Obtener transcript por número
   * Roles: ADMIN
   */
  @Get('by-number/:number')
  @Roles(RoleCode.ADMIN)
  async findByNumber(@Param('number') transcriptNumber: string) {
    return this.transcriptsService.findByNumber(transcriptNumber);
  }

  /**
   * GET /transcripts/student/:studentId
   * Obtener transcripts de un estudiante específico
   * Roles: ADMIN o el propio estudiante
   */
  @Get('student/:studentId')
  @Roles(RoleCode.STUDENT, RoleCode.ADMIN)
  async findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @CurrentUser() user: any,
  ) {
    // Validar que estudiantes solo pueden ver sus propios transcripts
    const isAdmin = user.roles?.some((r: any) => r.code === 'ADMIN');
    if (!isAdmin && user.id !== studentId) {
      throw new ForbiddenException(
        'Solo puede consultar sus propios transcripts',
      );
    }

    return this.transcriptsService.findByStudent(studentId);
  }

  /**
   * GET /transcripts/:id
   * Obtener un transcript por ID
   * Roles: ADMIN o el estudiante propietario
   */
  @Get(':id')
  @Roles(RoleCode.STUDENT, RoleCode.ADMIN)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const transcript = await this.transcriptsService.findOne(id);

    // Validar permisos
    const isAdmin = user.roles?.some((r: any) => r.code === 'ADMIN');
    if (!isAdmin && transcript.studentId !== user.id) {
      throw new ForbiddenException(
        'No tiene permisos para ver este transcript',
      );
    }

    return transcript;
  }

  /**
   * GET /transcripts/:id/download
   * Descargar el PDF de un transcript
   * Roles: ADMIN o el estudiante propietario
   */
  @Get(':id/download')
  @Roles(RoleCode.STUDENT, RoleCode.ADMIN)
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const transcript = await this.transcriptsService.findOne(id);

    // Validar permisos
    const isAdmin = user.roles?.some((r: any) => r.code === 'ADMIN');
    if (!isAdmin && transcript.studentId !== user.id) {
      throw new ForbiddenException(
        'No tiene permisos para descargar este transcript',
      );
    }

    const buffer = await this.transcriptsService.getFile(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${transcript.transcriptNumber}.pdf"`,
      'Content-Length': buffer.length,
    });

    return res.send(buffer);
  }

  /**
   * PATCH /transcripts/:id/revoke
   * Revocar un transcript
   * Roles: ADMIN
   */
  @Patch(':id/revoke')
  @Roles(RoleCode.ADMIN)
  async revoke(
    @Param('id', ParseIntPipe) id: number,
    @Body() revokeDto: RevokeTranscriptDto,
    @CurrentUser() user: any,
  ) {
    return this.transcriptsService.revoke(id, revokeDto, user.id);
  }

  /**
   * POST /transcripts/:id/regenerate
   * Regenerar el PDF de un transcript existente
   * Roles: ADMIN
   */
  @Post(':id/regenerate')
  @Roles(RoleCode.ADMIN)
  async regeneratePdf(@Param('id', ParseIntPipe) id: number) {
    return this.transcriptsService.regeneratePdf(id);
  }
}
