import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ProjectionExcelService {
  private styledHeader(row: ExcelJS.Row) {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    row.alignment = { vertical: 'middle' };
  }

  private title(sheet: ExcelJS.Worksheet, text: string, columns: number) {
    const range = `A1:${String.fromCharCode(64 + columns)}1`;
    sheet.mergeCells(range);
    const cell = sheet.getCell('A1');
    cell.value = text;
    cell.font = { bold: true, size: 16 };
    cell.alignment = { horizontal: 'center' };
  }

  async generateDemandBySubjectExcel(rows: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Académico';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Demanda por Asignatura');
    this.title(
      sheet,
      'Demanda por Asignatura - Proyección de Oferta Académica',
      6,
    );
    sheet.addRow([]);
    this.styledHeader(
      sheet.addRow([
        'Asignatura',
        'Pendientes',
        'Reprobados',
        'Demanda Total',
        'Estudiantes por Sección',
        'Secciones Necesarias',
      ]),
    );

    for (const r of rows) {
      sheet.addRow([
        r.courseName,
        r.pendingCount,
        r.failedCount,
        r.totalDemand,
        r.studentsPerSection,
        r.sectionsNeeded,
      ]);
    }

    sheet.getColumn(1).width = 40;
    sheet.getColumn(2).width = 14;
    sheet.getColumn(3).width = 14;
    sheet.getColumn(4).width = 14;
    sheet.getColumn(5).width = 22;
    sheet.getColumn(6).width = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateDemandByLevelExcel(rows: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Académico';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Demanda por Nivel');
    this.title(sheet, 'Demanda por Nivel - Proyección de Oferta Académica', 2);
    sheet.addRow([]);
    this.styledHeader(sheet.addRow(['Nivel', 'Cantidad de Estudiantes']));

    for (const r of rows) {
      sheet.addRow([r.level, r.studentCount]);
    }

    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 24;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateSectionProjectionExcel(rows: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Académico';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Proyección de Secciones');
    this.title(
      sheet,
      'Proyección de Secciones - Proyección de Oferta Académica',
      3,
    );
    sheet.addRow([]);
    this.styledHeader(
      sheet.addRow(['Asignatura', 'Pendientes', 'Secciones Necesarias']),
    );

    for (const r of rows) {
      sheet.addRow([r.courseName, r.pendingCount, r.sectionsNeeded]);
    }

    sheet.getColumn(1).width = 40;
    sheet.getColumn(2).width = 14;
    sheet.getColumn(3).width = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateMatrixExcel(rows: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Académico';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Matriz de Pendientes');
    const courseNames = Array.from(
      new Set(rows.flatMap((r) => r.courses.map((c) => c.courseName))),
    );
    this.title(
      sheet,
      'Matriz de Asignaturas Pendientes (0 = aprobada, 1 = pendiente)',
      courseNames.length + 1,
    );
    sheet.addRow([]);
    this.styledHeader(sheet.addRow(['Estudiante', ...courseNames]));

    for (const row of rows) {
      const courseMap = new Map(
        row.courses.map((c) => [c.courseName, c.status]),
      );
      sheet.addRow([
        row.studentName || `Estudiante #${row.studentId}`,
        ...courseNames.map((name) =>
          courseMap.get(name) === 'approved' ? 0 : 1,
        ),
      ]);
    }

    sheet.getColumn(1).width = 30;
    for (let i = 2; i <= courseNames.length + 1; i++) {
      sheet.getColumn(i).width = 22;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
