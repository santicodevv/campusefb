import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
import * as QRCode from 'qrcode';
import { Transcript } from '../entities/transcript.entity';

@Injectable()
export class TranscriptPdfService {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get('APP_BASE_URL') || 'http://localhost:3000';
  }

  /**
   * Generar PDF oficial del transcript
   */
  async generateTranscriptPdf(transcript: Transcript): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 50,
      info: {
        Title: `Récord Académico - ${transcript.transcriptNumber}`,
        Author: 'Sistema de Gestión Académica',
        Subject: 'Récord Académico Oficial',
        Keywords: 'transcript, record, academic',
      },
    });

    const chunks: Buffer[] = [];
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    try {
      this.renderHeader(doc, transcript);
      this.renderStudentInfo(doc, transcript);
      this.renderGradesTable(doc, transcript);
      this.renderSummary(doc, transcript);
      await this.renderFooter(doc, transcript);
      doc.end();
    } catch (error) {
      doc.end();
      throw error;
    }

    return pdfPromise;
  }

  /**
   * Render header institucional
   */
  private renderHeader(doc: typeof PDFDocument, transcript: Transcript): void {
    const pageWidth = doc.page.width - 100;

    // Título institucional
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('UNIVERSIDAD / INSTITUCIÓN EDUCATIVA', 50, 50, {
        align: 'center',
        width: pageWidth,
      });

    doc.moveDown(0.3);
    doc.fontSize(14).font('Helvetica').text('Sistema de Gestión Académica', {
      align: 'center',
      width: pageWidth,
    });

    doc.moveDown(0.8);

    // Título del documento
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('RÉCORD ACADÉMICO OFICIAL', { align: 'center', width: pageWidth });

    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Documento No: ${transcript.transcriptNumber}`, {
        align: 'center',
        width: pageWidth,
      });

    // Línea separadora
    doc.moveDown(0.5);
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .lineWidth(2)
      .stroke();
    doc.moveDown(1);
  }

  /**
   * Render información del estudiante
   */
  private renderStudentInfo(
    doc: typeof PDFDocument,
    transcript: Transcript,
  ): void {
    const startY = doc.y;
    const leftCol = 50;
    const rightCol = 300;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('INFORMACIÓN DEL ESTUDIANTE', leftCol, startY);
    doc.moveDown(0.5);

    const infoStartY = doc.y;

    // Columna izquierda
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Nombre:', leftCol, infoStartY);
    doc
      .font('Helvetica')
      .text(transcript.studentData.displayName, leftCol + 70, infoStartY);

    doc.font('Helvetica-Bold').text('Email:', leftCol, infoStartY + 18);
    doc
      .font('Helvetica')
      .text(transcript.studentData.email, leftCol + 70, infoStartY + 18);

    // Columna derecha
    doc.font('Helvetica-Bold').text('Fecha de emisión:', rightCol, infoStartY);
    doc
      .font('Helvetica')
      .text(
        new Date(transcript.summaryData.generatedAt).toLocaleDateString(
          'es-ES',
        ),
        rightCol + 100,
        infoStartY,
      );

    doc.font('Helvetica-Bold').text('ID Moodle:', rightCol, infoStartY + 18);
    doc
      .font('Helvetica')
      .text(
        transcript.studentData.moodleUserId?.toString() || 'N/A',
        rightCol + 100,
        infoStartY + 18,
      );

    doc.y = infoStartY + 50;

    // Línea separadora
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(1);
  }

  /**
   * Render tabla de calificaciones
   */
  private renderGradesTable(
    doc: typeof PDFDocument,
    transcript: Transcript,
  ): void {
    doc.fontSize(12).font('Helvetica-Bold').text('HISTORIAL ACADÉMICO');
    doc.moveDown(0.5);

    // Agrupar por período
    const periodGroups = new Map<string, typeof transcript.gradesData>();
    for (const course of transcript.gradesData) {
      if (!periodGroups.has(course.periodCode)) {
        periodGroups.set(course.periodCode, []);
      }
      periodGroups.get(course.periodCode)!.push(course);
    }

    const colWidths = [200, 100, 60, 60, 80];
    const headers = ['Curso', 'Evaluación', 'Nota', 'Máximo', 'Porcentaje'];

    for (const [periodCode, courses] of periodGroups) {
      // Verificar espacio para nueva página
      if (doc.y > 650) {
        doc.addPage();
        doc.y = 50;
      }

      // Header del período
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#2c3e50')
        .text(`Período: ${periodCode}`, 50, doc.y, { underline: true });
      doc.fillColor('black');
      doc.moveDown(0.5);

      // Headers de la tabla
      let xPos = 50;
      const headerY = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');

      // Fondo del header
      doc.rect(50, headerY - 3, doc.page.width - 100, 15).fill('#ecf0f1');
      doc.fillColor('black');

      headers.forEach((header, i) => {
        doc.text(header, xPos, headerY, { width: colWidths[i] });
        xPos += colWidths[i];
      });

      doc.moveDown(0.8);

      // Datos
      doc.font('Helvetica').fontSize(8);

      for (const course of courses) {
        if (doc.y > 700) {
          doc.addPage();
          doc.y = 50;
        }

        // Nombre del curso
        doc
          .font('Helvetica-Bold')
          .text(course.courseName.substring(0, 35), 50, doc.y);
        doc.font('Helvetica');
        doc.moveDown(0.3);

        // Items del curso
        for (const item of course.gradeItems) {
          if (doc.y > 700) {
            doc.addPage();
            doc.y = 50;
          }

          xPos = 50;
          const rowY = doc.y;

          doc.text('', xPos, rowY, { width: colWidths[0] }); // Espacio para indentación
          xPos += colWidths[0];

          doc.text(`  ${item.itemName.substring(0, 15)}`, 60, rowY, {
            width: colWidths[1] - 10,
          });
          doc.text(item.grade.toFixed(2), xPos, rowY, { width: colWidths[2] });
          xPos += colWidths[2];
          doc.text(item.gradeMax.toString(), xPos, rowY, {
            width: colWidths[3],
          });
          xPos += colWidths[3];
          doc.text(`${item.percentage.toFixed(1)}%`, xPos, rowY, {
            width: colWidths[4],
          });

          doc.moveDown(0.5);
        }

        // Promedio del curso
        doc
          .font('Helvetica-Bold')
          .text(
            `Promedio del curso: ${course.courseAverage.toFixed(2)}%`,
            300,
            doc.y,
            {
              align: 'right',
              width: 200,
            },
          );
        doc.moveDown(0.8);
      }

      doc.moveDown(0.5);
    }

    // Línea separadora
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.5);
  }

  /**
   * Render resumen académico
   */
  private renderSummary(doc: typeof PDFDocument, transcript: Transcript): void {
    if (doc.y > 650) {
      doc.addPage();
      doc.y = 50;
    }

    doc.fontSize(12).font('Helvetica-Bold').text('RESUMEN ACADÉMICO');
    doc.moveDown(0.5);

    const summaryY = doc.y;

    // Box de resumen
    doc.rect(50, summaryY, doc.page.width - 100, 60).fill('#f8f9fa');
    doc.fillColor('black');

    doc.fontSize(10).font('Helvetica');
    doc.text(
      `Total de cursos: ${transcript.summaryData.totalCourses}`,
      60,
      summaryY + 10,
    );
    doc.text(
      `Total de evaluaciones: ${transcript.gradesData.reduce((acc, c) => acc + c.gradeItems.length, 0)}`,
      60,
      summaryY + 25,
    );

    doc.font('Helvetica-Bold').fontSize(14);
    doc.text(
      `PROMEDIO GENERAL: ${transcript.summaryData.overallAverage.toFixed(2)}%`,
      300,
      summaryY + 20,
    );

    doc.y = summaryY + 70;
    doc.moveDown(0.5);
  }

  /**
   * Render footer con QR y verificación
   */
  private async renderFooter(
    doc: typeof PDFDocument,
    transcript: Transcript,
  ): Promise<void> {
    // Verificar si necesitamos nueva página
    if (doc.y > 600) {
      doc.addPage();
      doc.y = 50;
    }

    const footerY = doc.page.height - 180;

    // Línea separadora
    doc
      .moveTo(50, footerY)
      .lineTo(doc.page.width - 50, footerY)
      .lineWidth(1)
      .stroke();

    // Generar QR Code
    const verificationUrl = `${this.baseUrl}/api/transcripts/verify/${transcript.verificationHash}`;
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 100,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    // Convertir data URL a buffer
    const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(qrBase64, 'base64');

    // Insertar QR
    doc.image(qrBuffer, 50, footerY + 15, { width: 80, height: 80 });

    // Texto de verificación
    doc
      .fontSize(9)
      .font('Helvetica')
      .text('VERIFICACIÓN DE AUTENTICIDAD', 150, footerY + 15);
    doc.fontSize(8);
    doc.text(
      `Código de verificación: ${transcript.verificationHash.substring(0, 32)}...`,
      150,
      footerY + 30,
    );
    doc.text(`Escanee el código QR o visite:`, 150, footerY + 45);
    doc
      .fillColor('blue')
      .text(verificationUrl, 150, footerY + 58, { link: verificationUrl });
    doc.fillColor('black');

    // Sello de autenticidad
    doc.fontSize(7).font('Helvetica');
    doc.text(
      'Este documento fue generado electrónicamente y puede ser verificado en línea.',
      150,
      footerY + 80,
    );
    doc.text(
      `Fecha de generación: ${new Date(transcript.summaryData.generatedAt).toLocaleString('es-ES')}`,
      150,
      footerY + 92,
    );

    // Hash completo al final
    doc.fontSize(6).font('Helvetica');
    doc.text(
      `SHA-256: ${transcript.verificationHash}`,
      50,
      doc.page.height - 30,
      {
        align: 'center',
        width: doc.page.width - 100,
      },
    );
  }
}
