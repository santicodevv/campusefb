import {
  Controller,
  Get,
  Param,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportsService } from './services/reports.service';
import { ExcelService } from './services/excel.service';
import { PdfService } from './services/pdf.service';
import {
  StudentGradesFilterDto,
  CourseGradesFilterDto,
  PeriodReportFilterDto,
  GlobalSummaryFilterDto,
  ExportFormat,
} from './dto/report-filters.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly excelService: ExcelService,
    private readonly pdfService: PdfService,
  ) {}

  /**
   * GET /reports/grades/by-student/:studentId
   * Reporte de calificaciones de un estudiante
   * Roles: STUDENT (solo sus propias calificaciones), TEACHER, ADMIN
   */
  @Get('grades/by-student/:studentId')
  @Roles(RoleCode.STUDENT, RoleCode.TEACHER, RoleCode.ADMIN)
  async getStudentGrades(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() filters: StudentGradesFilterDto,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Validar que estudiantes solo pueden ver sus propias calificaciones
    const isStudent = user.roles?.some((r: any) => r.code === 'STUDENT');
    const isTeacherOrAdmin = user.roles?.some(
      (r: any) => r.code === 'TEACHER' || r.code === 'ADMIN',
    );

    if (isStudent && !isTeacherOrAdmin && user.id !== studentId) {
      throw new ForbiddenException(
        'Solo puede consultar sus propias calificaciones',
      );
    }

    const report = await this.reportsService.getStudentGradesReport(
      studentId,
      filters,
    );

    if (filters.format === ExportFormat.EXCEL) {
      const buffer = await this.excelService.generateStudentGradesExcel(report);
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="calificaciones_estudiante_${studentId}.xlsx"`,
      });
      return res.send(buffer);
    }

    if (filters.format === ExportFormat.PDF) {
      const buffer = await this.pdfService.generateStudentGradesPdf(report);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="calificaciones_estudiante_${studentId}.pdf"`,
      });
      return res.send(buffer);
    }

    return report;
  }

  /**
   * GET /reports/grades/by-course/:courseId
   * Reporte de calificaciones de un curso
   * Roles: TEACHER, ADMIN
   */
  @Get('grades/by-course/:courseId')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN)
  async getCourseGrades(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query() filters: CourseGradesFilterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.reportsService.getCourseGradesReport(
      courseId,
      filters,
    );

    if (filters.format === ExportFormat.EXCEL) {
      const buffer = await this.excelService.generateCourseGradesExcel(report);
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="calificaciones_curso_${courseId}.xlsx"`,
      });
      return res.send(buffer);
    }

    if (filters.format === ExportFormat.PDF) {
      const buffer = await this.pdfService.generateCourseGradesPdf(report);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="calificaciones_curso_${courseId}.pdf"`,
      });
      return res.send(buffer);
    }

    return report;
  }

  /**
   * GET /reports/grades/by-period/:periodId
   * Reporte de calificaciones por período
   * Roles: ADMIN
   */
  @Get('grades/by-period/:periodId')
  @Roles(RoleCode.ADMIN)
  async getPeriodReport(
    @Param('periodId', ParseIntPipe) periodId: number,
    @Query() filters: PeriodReportFilterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.reportsService.getPeriodReport(periodId, filters);

    if (filters.format === ExportFormat.EXCEL) {
      const buffer = await this.excelService.generatePeriodReportExcel(report);
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reporte_periodo_${periodId}.xlsx"`,
      });
      return res.send(buffer);
    }

    if (filters.format === ExportFormat.PDF) {
      const buffer = await this.pdfService.generatePeriodReportPdf(report);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte_periodo_${periodId}.pdf"`,
      });
      return res.send(buffer);
    }

    return report;
  }

  /**
   * GET /reports/global/summary
   * Resumen global institucional (estadísticas del dashboard)
   * Roles: ADMIN
   */
  @Get('global/summary')
  @Roles(RoleCode.ADMIN)
  async getGlobalSummary(
    @Query() filters: GlobalSummaryFilterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Si no hay filtros ni formato de exportación, devolver estadísticas del dashboard
    const hasFilters = filters.periodId || filters.startDate || filters.endDate;
    const hasFormat = (filters as any).format;

    if (!hasFilters && !hasFormat) {
      return this.reportsService.getDashboardStats();
    }

    const report = await this.reportsService.getGlobalSummary(filters);

    // El resumen global solo soporta Excel por su complejidad
    if ((filters as any).format === ExportFormat.EXCEL) {
      const buffer = await this.excelService.generateGlobalSummaryExcel(report);
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="resumen_global.xlsx"`,
      });
      return res.send(buffer);
    }

    return report;
  }

  /**
   * GET /reports/global/active-students
   * Estudiantes activos ordenados por último acceso
   * Roles: ADMIN
   */
  @Get('global/active-students')
  @Roles(RoleCode.ADMIN)
  async getActiveStudents(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.reportsService.getActiveStudents(parsedLimit);
  }

  /**
   * GET /reports/my-grades
   * Reporte de calificaciones del estudiante autenticado
   * Roles: STUDENT
   */
  @Get('my-grades')
  @Roles(RoleCode.STUDENT, RoleCode.TEACHER, RoleCode.ADMIN)
  async getMyGrades(
    @Query() filters: StudentGradesFilterDto,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.reportsService.getStudentGradesReport(
      user.id,
      filters,
    );

    if (filters.format === ExportFormat.EXCEL) {
      const buffer = await this.excelService.generateStudentGradesExcel(report);
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="mis_calificaciones.xlsx"`,
      });
      return res.send(buffer);
    }

    if (filters.format === ExportFormat.PDF) {
      const buffer = await this.pdfService.generateStudentGradesPdf(report);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="mis_calificaciones.pdf"`,
      });
      return res.send(buffer);
    }

    return report;
  }
}
