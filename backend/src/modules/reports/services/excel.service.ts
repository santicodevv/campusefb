import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  StudentGradesReportDto,
  CourseGradesReportDto,
  PeriodReportDto,
  GlobalSummaryDto,
} from '../dto/report-responses.dto';

@Injectable()
export class ExcelService {
  /**
   * Generar Excel de reporte de calificaciones por estudiante
   */
  async generateStudentGradesExcel(
    report: StudentGradesReportDto,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Académico';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Calificaciones');

    // Header de información del estudiante
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Reporte de Calificaciones - ${report.studentName}`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    sheet.getCell('A2').value = 'Email:';
    sheet.getCell('B2').value = report.studentEmail;
    sheet.getCell('A3').value = 'Período:';
    sheet.getCell('B3').value = report.periodCode || 'Todos';

    // Resumen
    sheet.getCell('A5').value = 'RESUMEN';
    sheet.getCell('A5').font = { bold: true };
    sheet.getCell('A6').value = 'Total de calificaciones:';
    sheet.getCell('B6').value = report.summary.totalGrades;
    sheet.getCell('A7').value = 'Promedio general:';
    sheet.getCell('B7').value = `${report.summary.averagePercentage}%`;
    sheet.getCell('A8').value = 'Cursos:';
    sheet.getCell('B8').value = report.summary.coursesCount;

    // Tabla de calificaciones
    sheet.addRow([]);
    sheet.addRow([
      'Curso',
      'Item de Evaluación',
      'Calificación',
      'Máximo',
      'Porcentaje',
      'Retroalimentación',
      'Profesor',
      'Período',
      'Sincronizado',
    ]);

    const headerRowNum = sheet.rowCount;
    const headerCells = sheet.getRow(headerRowNum);
    headerCells.font = { bold: true };
    headerCells.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerCells.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Datos
    for (const grade of report.grades) {
      sheet.addRow([
        grade.courseName,
        grade.gradeItemName,
        grade.grade,
        grade.gradeMax,
        `${grade.percentage}%`,
        grade.feedback || '',
        grade.teacherName,
        grade.periodCode,
        grade.syncedToMoodle ? 'Sí' : 'No',
      ]);
    }

    // Ajustar anchos de columna
    sheet.columns = [
      { width: 30 }, // Curso
      { width: 25 }, // Item
      { width: 12 }, // Calificación
      { width: 10 }, // Máximo
      { width: 12 }, // Porcentaje
      { width: 40 }, // Retroalimentación
      { width: 25 }, // Profesor
      { width: 12 }, // Período
      { width: 12 }, // Sincronizado
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generar Excel de reporte de calificaciones por curso
   */
  async generateCourseGradesExcel(
    report: CourseGradesReportDto,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Académico';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Calificaciones por Curso');

    // Header
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Reporte de Calificaciones - ${report.courseName}`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    sheet.getCell('A2').value = 'Período:';
    sheet.getCell('B2').value = report.periodCode || 'Todos';

    // Estadísticas
    sheet.getCell('A4').value = 'ESTADÍSTICAS';
    sheet.getCell('A4').font = { bold: true };
    sheet.getCell('A5').value = 'Total estudiantes:';
    sheet.getCell('B5').value = report.statistics.totalStudents;
    sheet.getCell('A6').value = 'Total calificaciones:';
    sheet.getCell('B6').value = report.statistics.totalGrades;
    sheet.getCell('A7').value = 'Promedio:';
    sheet.getCell('B7').value = report.statistics.averageGrade;
    sheet.getCell('A8').value = 'Tasa de aprobación:';
    sheet.getCell('B8').value = `${report.statistics.passRate}%`;
    sheet.getCell('A9').value = 'Nota más alta:';
    sheet.getCell('B9').value = report.statistics.highestGrade;
    sheet.getCell('A10').value = 'Nota más baja:';
    sheet.getCell('B10').value = report.statistics.lowestGrade;

    // Construir headers dinámicos basados en los items de calificación
    const headers = [
      'Estudiante',
      'Email',
      ...report.gradeItems.map((i) => i.name),
      'Promedio',
    ];
    sheet.addRow([]);
    sheet.addRow([]);
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Datos de estudiantes
    for (const student of report.students) {
      const gradeValues = report.gradeItems.map((item) => {
        const grade = student.grades.find((g) => g.gradeItemId === item.id);
        return grade ? grade.grade : '-';
      });
      sheet.addRow([
        student.studentName,
        student.studentEmail,
        ...gradeValues,
        `${student.averagePercentage}%`,
      ]);
    }

    // Ajustar anchos
    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 30;
    for (let i = 3; i <= headers.length; i++) {
      sheet.getColumn(i).width = 15;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generar Excel de reporte por período
   */
  async generatePeriodReportExcel(report: PeriodReportDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Académico';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Reporte por Período');

    // Header
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Reporte del Período: ${report.periodName} (${report.periodCode})`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    sheet.getCell('A2').value = 'Fecha inicio:';
    sheet.getCell('B2').value = report.startDate.toISOString().split('T')[0];
    sheet.getCell('A3').value = 'Fecha fin:';
    sheet.getCell('B3').value = report.endDate.toISOString().split('T')[0];
    sheet.getCell('A4').value = 'Estado:';
    sheet.getCell('B4').value = report.status;

    // Resumen general
    sheet.getCell('A6').value = 'RESUMEN GENERAL';
    sheet.getCell('A6').font = { bold: true };
    sheet.getCell('A7').value = 'Total cursos:';
    sheet.getCell('B7').value = report.summary.totalCourses;
    sheet.getCell('A8').value = 'Total estudiantes:';
    sheet.getCell('B8').value = report.summary.totalStudents;
    sheet.getCell('A9').value = 'Total calificaciones:';
    sheet.getCell('B9').value = report.summary.totalGrades;
    sheet.getCell('A10').value = 'Promedio general:';
    sheet.getCell('B10').value = report.summary.overallAverageGrade;
    sheet.getCell('A11').value = 'Tasa de aprobación:';
    sheet.getCell('B11').value = `${report.summary.overallPassRate}%`;

    // Tabla de cursos
    sheet.addRow([]);
    sheet.addRow([]);
    const headerRow = sheet.addRow([
      'Curso',
      'Estudiantes',
      'Calificaciones',
      'Promedio',
      'Tasa de Aprobación',
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    for (const course of report.courses) {
      sheet.addRow([
        course.courseName,
        course.totalStudents,
        course.totalGrades,
        course.averageGrade,
        `${course.passRate}%`,
      ]);
    }

    // Anchos
    sheet.getColumn(1).width = 40;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generar Excel de resumen global
   */
  async generateGlobalSummaryExcel(report: GlobalSummaryDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Académico';
    workbook.created = new Date();

    // Hoja de Resumen
    const summarySheet = workbook.addWorksheet('Resumen General');

    summarySheet.mergeCells('A1:D1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'Reporte Global Institucional';
    titleCell.font = { bold: true, size: 18 };
    titleCell.alignment = { horizontal: 'center' };

    summarySheet.getCell('A3').value = 'Generado:';
    summarySheet.getCell('B3').value = report.generatedAt.toISOString();

    summarySheet.getCell('A5').value = 'VISIÓN GENERAL';
    summarySheet.getCell('A5').font = { bold: true, size: 14 };
    summarySheet.getCell('A6').value = 'Total períodos:';
    summarySheet.getCell('B6').value = report.overview.totalPeriods;
    summarySheet.getCell('A7').value = 'Total cursos:';
    summarySheet.getCell('B7').value = report.overview.totalCourses;
    summarySheet.getCell('A8').value = 'Total estudiantes:';
    summarySheet.getCell('B8').value = report.overview.totalStudents;
    summarySheet.getCell('A9').value = 'Total profesores:';
    summarySheet.getCell('B9').value = report.overview.totalTeachers;
    summarySheet.getCell('A10').value = 'Total calificaciones:';
    summarySheet.getCell('B10').value = report.overview.totalGrades;

    // Hoja de distribución
    const distSheet = workbook.addWorksheet('Distribución de Notas');
    distSheet.addRow(['Rango', 'Cantidad', 'Porcentaje']);
    distSheet.getRow(1).font = { bold: true };

    for (const dist of report.gradeDistribution) {
      distSheet.addRow([dist.range, dist.count, `${dist.percentage}%`]);
    }

    distSheet.getColumn(1).width = 25;
    distSheet.getColumn(2).width = 15;
    distSheet.getColumn(3).width = 15;

    // Hoja de comparación por período
    const compSheet = workbook.addWorksheet('Comparación por Período');
    compSheet.addRow([
      'Período',
      'Promedio',
      'Tasa Aprobación',
      'Total Calificaciones',
    ]);
    compSheet.getRow(1).font = { bold: true };

    for (const period of report.periodComparison) {
      compSheet.addRow([
        period.periodCode,
        period.averageGrade,
        `${period.passRate}%`,
        period.totalGrades,
      ]);
    }

    compSheet.getColumn(1).width = 20;
    compSheet.getColumn(2).width = 15;
    compSheet.getColumn(3).width = 20;
    compSheet.getColumn(4).width = 20;

    // Hoja de top cursos
    const topSheet = workbook.addWorksheet('Top Cursos');
    topSheet.addRow(['Curso', 'Promedio', 'Tasa Aprobación']);
    topSheet.getRow(1).font = { bold: true };

    for (const course of report.topPerformingCourses) {
      topSheet.addRow([
        course.courseName,
        course.averageGrade,
        `${course.passRate}%`,
      ]);
    }

    topSheet.getColumn(1).width = 40;
    topSheet.getColumn(2).width = 15;
    topSheet.getColumn(3).width = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
