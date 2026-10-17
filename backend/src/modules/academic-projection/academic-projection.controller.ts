import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseEnumPipe,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ProjectionService } from './academic-projection.service';
import { ProjectionExcelService } from './services/projection-excel.service';
import { CreateAcademicProgramDto } from './dto/create-academic-program.dto';
import { UpdateAcademicProgramDto } from './dto/update-academic-program.dto';
import { CreateStudyPlanDto } from './dto/create-study-plan.dto';
import { CreateProgramCourseDto } from './dto/create-program-course.dto';
import { AssignStudentProgramDto } from './dto/assign-student-program.dto';
import { ProgramCompletionStatus } from './dto/program-completion-status';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../users/entities/role.entity';

const EXCEL_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Controller('academic-projection')
export class ProjectionController {
  constructor(
    private readonly projectionService: ProjectionService,
    private readonly excelService: ProjectionExcelService,
  ) {}

  // ========== CATEGORY HIERARCHY ==========

  @Get('categories/hierarchy')
  async getCategoryHierarchy() {
    return this.projectionService.getCategoryHierarchy();
  }

  @Get('subprograms')
  async getSubprograms() {
    return this.projectionService.getSubprograms();
  }

  @Get('subprograms/:moodleId/materias')
  async getMateriasBySubprogram(
    @Param('moodleId', ParseIntPipe) moodleId: number,
  ) {
    return this.projectionService.getMateriasBySubprogram(moodleId);
  }

  @Roles(RoleCode.ADMIN)
  @Post('programs/cleanup-invalid')
  async cleanupInvalidPrograms() {
    return this.projectionService.cleanupInvalidPrograms();
  }

  // ========== PROGRAMS ==========

  @Get('programs')
  async findAllPrograms() {
    return this.projectionService.findAllPrograms();
  }

  @Roles(RoleCode.ADMIN)
  @Post('programs')
  async createProgram(@Body() dto: CreateAcademicProgramDto) {
    return this.projectionService.createProgram(dto);
  }

  @Roles(RoleCode.ADMIN)
  @Get('programs/:id')
  async findProgramById(@Param('id', ParseIntPipe) id: number) {
    return this.projectionService.findProgramById(id);
  }

  @Roles(RoleCode.ADMIN)
  @Patch('programs/:id')
  async updateProgram(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAcademicProgramDto,
  ) {
    return this.projectionService.updateProgram(id, dto);
  }

  @Roles(RoleCode.ADMIN)
  @Delete('programs/:id')
  async deleteProgram(@Param('id', ParseIntPipe) id: number) {
    await this.projectionService.deleteProgram(id);
    return { success: true };
  }

  // ========== STUDY PLANS ==========

  @Roles(RoleCode.ADMIN)
  @Post('programs/:id/study-plans')
  async addStudyPlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateStudyPlanDto,
  ) {
    return this.projectionService.addStudyPlan(id, dto);
  }

  @Get('programs/:id/study-plans')
  async getStudyPlansByProgram(@Param('id', ParseIntPipe) id: number) {
    return this.projectionService.getStudyPlansByProgram(id);
  }

  @Get('categories/:categoryMoodleId/study-plans')
  async getStudyPlansByCategory(
    @Param('categoryMoodleId', ParseIntPipe) categoryMoodleId: number,
  ) {
    return this.projectionService.getStudyPlansByCategory(categoryMoodleId);
  }

  @Roles(RoleCode.ADMIN)
  @Patch('study-plans/:id')
  async updateStudyPlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateStudyPlanDto>,
  ) {
    return this.projectionService.updateStudyPlan(id, dto);
  }

  @Roles(RoleCode.ADMIN)
  @Delete('study-plans/:id')
  async removeStudyPlan(@Param('id', ParseIntPipe) id: number) {
    await this.projectionService.removeStudyPlan(id);
    return { success: true };
  }

  // ========== PROGRAM COURSES ==========

  @Roles(RoleCode.ADMIN)
  @Post('programs/:id/courses')
  async createProgramCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateProgramCourseDto,
  ) {
    return this.projectionService.createCourseForProgram(id, dto);
  }

  @Roles(RoleCode.ADMIN)
  @Post('study-plans/auto-assign')
  async autoAssignCoursesToPrograms() {
    return this.projectionService.autoAssignCoursesToPrograms();
  }

  @Get('study-plans/by-course/:courseMoodleId')
  async getProgramsByCourse(
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
  ) {
    return this.projectionService.getProgramsByCourse(courseMoodleId);
  }

  // ========== STUDENT PROGRAM ==========

  @Roles(RoleCode.ADMIN)
  @Post('student-program')
  async assignStudentToProgram(@Body() dto: AssignStudentProgramDto) {
    return this.projectionService.assignStudentToProgram(dto);
  }

  @Roles(RoleCode.ADMIN)
  @Post('student-program/toggle')
  async toggleStudentProgram(@Body() dto: AssignStudentProgramDto) {
    return this.projectionService.toggleStudentProgram(dto);
  }

  @Get('students')
  async findAllStudents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.projectionService.findStudentsPaginated(
      page ? Math.max(1, parseInt(page, 10)) : 1,
      limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 10,
      search?.trim() || undefined,
    );
  }

  @Get('student-program/student/:userId')
  async getStudentPrograms(@Param('userId', ParseIntPipe) userId: number) {
    return this.projectionService.getStudentPrograms(userId);
  }

  @Roles(RoleCode.ADMIN)
  @Delete('student-program/:id')
  async removeStudentFromProgram(@Param('id', ParseIntPipe) id: number) {
    await this.projectionService.removeStudentFromProgram(id);
    return { success: true };
  }

  // ========== PROJECTIONS ==========

  @Get('pending-subjects')
  async getPendingSubjects(@Query('programId') programId?: number) {
    return this.projectionService.getPendingSubjects(
      programId ? Number(programId) : undefined,
    );
  }

  @Get('demand-by-subject')
  async getDemandBySubject(
    @Res({ passthrough: true }) res: Response,
    @Query('programId') programId?: number,
    @Query('format') format?: string,
  ) {
    const demand = await this.projectionService.getDemandBySubject(
      programId ? Number(programId) : undefined,
    );
    if (format === 'excel') {
      const buffer =
        await this.excelService.generateDemandBySubjectExcel(demand);
      res.set({
        'Content-Type': EXCEL_CONTENT_TYPE,
        'Content-Disposition':
          'attachment; filename="oferta_demanda_asignatura.xlsx"',
      });
      return res.send(buffer);
    }
    return demand;
  }

  @Get('demand-by-level')
  async getDemandByLevel(
    @Res({ passthrough: true }) res: Response,
    @Query('programId') programId?: number,
    @Query('categoryMoodleId') categoryMoodleId?: number,
    @Query('format') format?: string,
  ) {
    const levels = await this.projectionService.getDemandByLevel(
      programId ? Number(programId) : undefined,
      categoryMoodleId ? Number(categoryMoodleId) : undefined,
    );
    if (format === 'excel') {
      const buffer = await this.excelService.generateDemandByLevelExcel(levels);
      res.set({
        'Content-Type': EXCEL_CONTENT_TYPE,
        'Content-Disposition':
          'attachment; filename="oferta_demanda_nivel.xlsx"',
      });
      return res.send(buffer);
    }
    return levels;
  }

  @Get('section-projection')
  async getSectionProjection(
    @Res({ passthrough: true }) res: Response,
    @Query('programId') programId?: number,
    @Query('categoryMoodleId') categoryMoodleId?: number,
    @Query('maxStudents') maxStudents?: number,
    @Query('format') format?: string,
  ) {
    const sections = await this.projectionService.getSectionProjection(
      programId ? Number(programId) : undefined,
      categoryMoodleId ? Number(categoryMoodleId) : undefined,
      maxStudents ? Number(maxStudents) : 25,
    );
    if (format === 'excel') {
      const buffer =
        await this.excelService.generateSectionProjectionExcel(sections);
      res.set({
        'Content-Type': EXCEL_CONTENT_TYPE,
        'Content-Disposition':
          'attachment; filename="oferta_proyeccion_secciones.xlsx"',
      });
      return res.send(buffer);
    }
    return sections;
  }

  @Get('matrix')
  async getProjectionMatrix(
    @Res({ passthrough: true }) res: Response,
    @Query('programId') programId?: number,
    @Query('categoryMoodleId') categoryMoodleId?: number,
    @Query('format') format?: string,
  ) {
    const matrix = await this.projectionService.getProjectionMatrix(
      programId ? Number(programId) : undefined,
      categoryMoodleId ? Number(categoryMoodleId) : undefined,
    );
    if (format === 'excel') {
      const buffer = await this.excelService.generateMatrixExcel(matrix);
      res.set({
        'Content-Type': EXCEL_CONTENT_TYPE,
        'Content-Disposition':
          'attachment; filename="oferta_matriz_pendientes.xlsx"',
      });
      return res.send(buffer);
    }
    return matrix;
  }

  @Get('student-grades-by-program')
  async getStudentGradesByProgram(
    @Query('programId') programId?: string,
    @Query('categoryMoodleId') categoryMoodleId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.projectionService.getStudentGradesByProgram(
      programId ? parseInt(programId, 10) : undefined,
      categoryMoodleId ? parseInt(categoryMoodleId, 10) : undefined,
      page ? Math.max(1, parseInt(page, 10)) : 1,
      limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 10,
    );
  }

  @Get('student-grades-matrix')
  async getStudentGradesMatrix(
    @Res({ passthrough: true }) res: Response,
    @Query('categoryMoodleId') categoryMoodleId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query(
      'completionStatus',
      new DefaultValuePipe(ProgramCompletionStatus.ALL),
      new ParseEnumPipe(ProgramCompletionStatus),
    )
    completionStatus: ProgramCompletionStatus = ProgramCompletionStatus.ALL,
    @Query('format') format?: string,
  ) {
    if (!categoryMoodleId) {
      return {
        courses: [],
        students: [],
        total: 0,
        page: 1,
        limit: 10,
        totalSubprograms: 0,
        selectionName: '',
      };
    }
    const matrix = await this.projectionService.getStudentGradesMatrix(
      parseInt(categoryMoodleId, 10),
      page ? Math.max(1, parseInt(page, 10)) : 1,
      limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 10,
      search,
      completionStatus,
      format !== 'excel',
    );
    if (format === 'excel') {
      const buffer = await this.excelService.generateStudentGradesMatrixExcel(
        matrix,
        completionStatus,
        search,
      );
      res.set({
        'Content-Type': EXCEL_CONTENT_TYPE,
        'Content-Disposition':
          'attachment; filename="demanda_estudiantes.xlsx"',
      });
      return res.send(buffer);
    }
    return matrix;
  }
}
