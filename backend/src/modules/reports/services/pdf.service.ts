import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
import {
  StudentGradesReportDto,
  CourseGradesReportDto,
  PeriodReportDto,
} from '../dto/report-responses.dto';

@Injectable()
export class PdfService {
  /**
   * Generar PDF de reporte de calificaciones por estudiante
   */
  async generateStudentGradesPdf(
    report: StudentGradesReportDto,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Reporte de Calificaciones', { align: 'center' });
      doc.moveDown();

      // Información del estudiante
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Información del Estudiante');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nombre: ${report.studentName}`);
      doc.text(`Email: ${report.studentEmail}`);
      doc.text(`Período: ${report.periodCode || 'Todos los períodos'}`);
      doc.moveDown();

      // Resumen
      doc.fontSize(12).font('Helvetica-Bold').text('Resumen');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total de calificaciones: ${report.summary.totalGrades}`);
      doc.text(`Promedio general: ${report.summary.averagePercentage}%`);
      doc.text(`Cursos: ${report.summary.coursesCount}`);
      doc.moveDown();

      // Tabla de calificaciones
      doc.fontSize(12).font('Helvetica-Bold').text('Detalle de Calificaciones');
      doc.moveDown(0.5);

      // Headers de tabla
      const tableTop = doc.y;
      const colWidths = [150, 120, 60, 60, 100];
      const headers = ['Curso', 'Evaluación', 'Nota', 'Max', 'Porcentaje'];

      doc.fontSize(9).font('Helvetica-Bold');
      let xPos = 50;
      headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: colWidths[i] });
        xPos += colWidths[i];
      });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Datos
      doc.font('Helvetica').fontSize(8);
      let yPos = tableTop + 20;

      for (const grade of report.grades) {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        xPos = 50;
        const rowData = [
          grade.courseName.substring(0, 25),
          grade.gradeItemName.substring(0, 20),
          grade.grade.toString(),
          grade.gradeMax.toString(),
          `${grade.percentage}%`,
        ];

        rowData.forEach((data, i) => {
          doc.text(data, xPos, yPos, { width: colWidths[i] });
          xPos += colWidths[i];
        });

        yPos += 15;
      }

      // Footer
      doc.moveDown(2);
      doc
        .fontSize(8)
        .text(`Generado: ${new Date().toISOString()}`, { align: 'right' });

      doc.end();
    });
  }

  /**
   * Generar PDF de reporte de calificaciones por curso
   */
  async generateCourseGradesPdf(
    report: CourseGradesReportDto,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(`Reporte de Calificaciones`, { align: 'center' });
      doc.fontSize(14).text(report.courseName, { align: 'center' });
      doc.moveDown();

      // Información del curso
      doc.fontSize(10).font('Helvetica');
      doc.text(`Período: ${report.periodCode || 'Todos los períodos'}`);
      doc.moveDown();

      // Estadísticas
      doc.fontSize(12).font('Helvetica-Bold').text('Estadísticas del Curso');
      doc.fontSize(10).font('Helvetica');

      const statsLeft = [
        `Total estudiantes: ${report.statistics.totalStudents}`,
        `Total calificaciones: ${report.statistics.totalGrades}`,
        `Promedio: ${report.statistics.averageGrade}`,
      ];

      const statsRight = [
        `Tasa de aprobación: ${report.statistics.passRate}%`,
        `Nota más alta: ${report.statistics.highestGrade}`,
        `Nota más baja: ${report.statistics.lowestGrade}`,
      ];

      const statsY = doc.y;
      statsLeft.forEach((stat, i) => {
        doc.text(stat, 50, statsY + i * 15);
      });
      statsRight.forEach((stat, i) => {
        doc.text(stat, 300, statsY + i * 15);
      });

      doc.y = statsY + 60;
      doc.moveDown();

      // Tabla de estudiantes
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Calificaciones por Estudiante');
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const baseColWidth = 150;
      const gradeColWidth = 60;

      // Headers
      doc.fontSize(8).font('Helvetica-Bold');
      let xPos = 50;
      doc.text('Estudiante', xPos, tableTop, { width: baseColWidth });
      xPos += baseColWidth;

      for (const item of report.gradeItems.slice(0, 6)) {
        // Limitar a 6 items por espacio
        doc.text(item.name.substring(0, 10), xPos, tableTop, {
          width: gradeColWidth,
        });
        xPos += gradeColWidth;
      }
      doc.text('Promedio', xPos, tableTop, { width: gradeColWidth });

      doc
        .moveTo(50, tableTop + 12)
        .lineTo(750, tableTop + 12)
        .stroke();

      // Datos
      doc.font('Helvetica').fontSize(7);
      let yPos = tableTop + 18;

      for (const student of report.students.slice(0, 25)) {
        // Limitar filas
        if (yPos > 500) {
          doc.addPage();
          yPos = 50;
        }

        xPos = 50;
        doc.text(student.studentName.substring(0, 25), xPos, yPos, {
          width: baseColWidth,
        });
        xPos += baseColWidth;

        for (const item of report.gradeItems.slice(0, 6)) {
          const grade = student.grades.find((g) => g.gradeItemId === item.id);
          doc.text(grade ? grade.grade.toString() : '-', xPos, yPos, {
            width: gradeColWidth,
          });
          xPos += gradeColWidth;
        }
        doc.text(`${student.averagePercentage}%`, xPos, yPos, {
          width: gradeColWidth,
        });

        yPos += 12;
      }

      // Footer
      doc.moveDown(2);
      doc
        .fontSize(8)
        .text(`Generado: ${new Date().toISOString()}`, { align: 'right' });

      doc.end();
    });
  }

  /**
   * Generar PDF de reporte por período
   */
  async generatePeriodReportPdf(report: PeriodReportDto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Reporte por Período Académico', { align: 'center' });
      doc.moveDown();

      // Información del período
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`${report.periodName} (${report.periodCode})`);
      doc.fontSize(10).font('Helvetica');
      doc.text(
        `Fecha inicio: ${new Date(report.startDate).toLocaleDateString()}`,
      );
      doc.text(`Fecha fin: ${new Date(report.endDate).toLocaleDateString()}`);
      doc.text(`Estado: ${report.status}`);
      doc.moveDown();

      // Resumen general
      doc.fontSize(12).font('Helvetica-Bold').text('Resumen General');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total cursos: ${report.summary.totalCourses}`);
      doc.text(`Total estudiantes: ${report.summary.totalStudents}`);
      doc.text(`Total calificaciones: ${report.summary.totalGrades}`);
      doc.text(`Promedio general: ${report.summary.overallAverageGrade}`);
      doc.text(`Tasa de aprobación: ${report.summary.overallPassRate}%`);
      doc.moveDown();

      // Tabla de cursos
      doc.fontSize(12).font('Helvetica-Bold').text('Detalle por Curso');
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const colWidths = [180, 80, 80, 80, 80];
      const headers = [
        'Curso',
        'Estudiantes',
        'Notas',
        'Promedio',
        'Aprobación',
      ];

      doc.fontSize(9).font('Helvetica-Bold');
      let xPos = 50;
      headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: colWidths[i] });
        xPos += colWidths[i];
      });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      doc.font('Helvetica').fontSize(8);
      let yPos = tableTop + 20;

      for (const course of report.courses) {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        xPos = 50;
        const rowData = [
          course.courseName.substring(0, 30),
          course.totalStudents.toString(),
          course.totalGrades.toString(),
          course.averageGrade.toString(),
          `${course.passRate}%`,
        ];

        rowData.forEach((data, i) => {
          doc.text(data, xPos, yPos, { width: colWidths[i] });
          xPos += colWidths[i];
        });

        yPos += 15;
      }

      // Footer
      doc.moveDown(2);
      doc
        .fontSize(8)
        .text(`Generado: ${new Date().toISOString()}`, { align: 'right' });

      doc.end();
    });
  }
}
