import { Card, CardContent } from '@/shared/components/ui';

export function TeacherGradesLegend() {
  return (
    <Card className="mt-6">
      <CardContent className="p-4">
        <p className="text-sm text-gray-600">
          <strong>Sumatoria Moodle:</strong> Es la suma de todas las notas de Moodle (solo lectura).<br />
          <strong>Nota Final:</strong> La nota que usted asigna al estudiante (0-10).<br />
          <strong>Comentario:</strong> Observaciones para el estudiante.
        </p>
      </CardContent>
    </Card>
  );
}
