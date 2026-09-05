import { Card, CardContent, Button, Spinner } from '@/shared/components/ui';
import { Download } from 'lucide-react';
import { getEquivalence, calculateCumulativeIndex } from '../../hooks/useAdminGradeRecord';
import type { CourseWithPeriod, UserGradesData } from '../../hooks/useAdminGradeRecord';

interface GradeRecordPreviewProps {
  gradesLoading: boolean;
  userGrades: UserGradesData | null | undefined;
  allCourses: CourseWithPeriod[];
  handlePrint: () => void;
  printRef: React.RefObject<HTMLDivElement | null>;
  today: string;
  docNumber: string;
}

export function GradeRecordPreview({
  gradesLoading,
  userGrades,
  allCourses,
  handlePrint,
  printRef,
  today,
  docNumber,
}: GradeRecordPreviewProps) {
  if (gradesLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!userGrades) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Vista Previa del Record</h3>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </div>

        <div
          ref={printRef}
          className="bg-white p-8 border rounded-lg"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          <div className="container" style={{ maxWidth: '100%', margin: '0 auto' }}>
            {/* Header with Logo */}
            <div className="header text-center mb-6" style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img
                src="https://i.imgur.com/BfhxWQH.png"
                alt="EFB - Escuela de Formación Bíblica"
                style={{ maxWidth: '280px', height: 'auto', margin: '0 auto 10px' }}
              />
            </div>

            {/* Student Info */}
            <div className="student-info mb-4" style={{ margin: '15px 0 20px 0' }}>
              <p style={{ margin: '4px 0', fontSize: '11pt' }}>
                <strong style={{ fontWeight: 'bold' }}>Nombres y apellidos:</strong>{' '}
                {userGrades.user.displayName || userGrades.user.email}
              </p>
              <p style={{ margin: '4px 0', fontSize: '11pt' }}>
                <strong style={{ fontWeight: 'bold' }}>Documento Nacional de Identidad:</strong>{' '}
                {userGrades.user.username || userGrades.user.email.split('@')[0]}
              </p>
            </div>

            {/* Date */}
            <div className="date-line text-right mb-4" style={{ textAlign: 'right', marginBottom: '15px' }}>
              <p style={{ margin: '4px 0', fontSize: '11pt' }}>
                <strong style={{ fontWeight: 'bold' }}>Fecha de expedición:</strong> {today}
              </p>
            </div>

            {/* Title Bar */}
            <div
              className="title-bar text-center py-3 mb-4"
              style={{
                backgroundColor: '#0d7377',
                color: 'white',
                padding: '10px 20px',
                textAlign: 'center',
                fontSize: '16pt',
                fontWeight: 'bold',
                fontStyle: 'italic',
                margin: '20px 0',
              }}
            >
              RECORD DE NOTAS
            </div>

            {/* Grades Table */}
            <table
              className="w-full border-collapse mb-6"
              style={{ width: '100%', borderCollapse: 'collapse', margin: '15px 0' }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px 10px', textAlign: 'left', fontWeight: 'bold', fontSize: '10pt' }}>
                    Clave
                  </th>
                  <th style={{ border: '1px solid #ddd', padding: '8px 10px', textAlign: 'left', fontWeight: 'bold', fontSize: '10pt' }}>
                    Nombre asignatura
                  </th>
                  <th style={{ border: '1px solid #ddd', padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt' }}>
                    Ciclo
                  </th>
                  <th style={{ border: '1px solid #ddd', padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt' }}>
                    NF
                  </th>
                  <th style={{ border: '1px solid #ddd', padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt' }}>
                    EQ
                  </th>
                </tr>
              </thead>
              <tbody>
                {allCourses.length > 0 ? (
                  allCourses.map((course, idx) => (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontSize: '10pt' }}>
                        {course.courseCode || course.courseShortname}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontSize: '10pt' }}>
                        {course.courseSubjectName || course.courseName}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontSize: '10pt', textAlign: 'center' }}>
                        {course.periodCode || '-'}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontSize: '10pt', textAlign: 'center', fontWeight: '600' }}>
                        {course.totalGrade !== null ? course.totalGrade : 0}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '6px 10px', fontSize: '10pt', textAlign: 'center' }}>
                        {getEquivalence(course.totalGrade)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ border: '1px solid #ddd', padding: '20px 10px', fontSize: '10pt', textAlign: 'center', color: '#6b7280' }}
                    >
                      No hay cursos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Cumulative Index Bar */}
            <div
              className="cumulative-bar flex justify-between items-center px-4 py-2 mb-8"
              style={{
                backgroundColor: '#d4a017',
                color: 'white',
                padding: '8px 20px',
                textAlign: 'center',
                fontSize: '12pt',
                fontWeight: 'bold',
                margin: '20px 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span></span>
              <span>Índice acumulado</span>
              <span style={{ fontSize: '16px' }}>{calculateCumulativeIndex(allCourses)}</span>
            </div>

            {/* Footer */}
            <div
              className="footer flex justify-between items-end mt-12"
              style={{ marginTop: '40px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}
            >
              <div className="footer-left flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="footer-seal">
                  <img
                    src="https://i.imgur.com/BfhxWQH.png"
                    alt="Sello EFB"
                    style={{ width: '80px', height: '80px', opacity: 0.8, borderRadius: '50%' }}
                  />
                </div>
                <div className="footer-signature text-center" style={{ textAlign: 'center' }}>
                  <p className="font-bold" style={{ margin: '2px 0', fontWeight: 'bold', fontSize: '11pt' }}>Juan Carlos Hernández</p>
                  <p className="font-bold text-sm" style={{ margin: '2px 0', fontWeight: 'bold', fontSize: '10pt' }}>Departamento de Registro</p>
                </div>
              </div>

              <div className="footer-right text-right" style={{ textAlign: 'right' }}>
                <p className="page-note text-sm italic mb-2" style={{ fontStyle: 'italic', fontSize: '9pt', marginTop: '15px' }}>
                  Este récord consta de una página
                </p>
                <p className="doc-id font-bold" style={{ fontSize: '11pt', fontWeight: 'bold' }}>{docNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
