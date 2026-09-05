import { Card, CardContent } from '@/shared/components/ui';
import { Calendar, Clock } from 'lucide-react';
import type { Course } from '@/modules/admin/types/course.types';

interface CourseInfoCardProps {
  course: Course;
}

export function CourseInfoCard({ course }: CourseInfoCardProps) {
  return (
    <Card className="lg:col-span-1">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informaci&oacute;n del Curso
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Nombre Completo</p>
            <p className="font-medium">{course.subjectName || course.fullname}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase">Código</p>
            <p className="font-mono">{course.code || <span className="text-gray-400 italic">Sin asignar</span>}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase">Grupo</p>
            <p className="font-mono">{course.shortname}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">ID Local</p>
              <p>{course.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">ID Moodle</p>
              <p>{course.moodleId}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase">Categor&iacute;a ID</p>
            <p>{course.categoryId || '-'}</p>
          </div>

          {course.idnumber && (
            <div>
              <p className="text-xs text-gray-500 uppercase">N&uacute;mero ID</p>
              <p>{course.idnumber}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Fecha Inicio
              </p>
              <p className="text-sm">
                {course.startdate
                  ? new Date(course.startdate).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Fecha Fin
              </p>
              <p className="text-sm">
                {course.enddate
                  ? new Date(course.enddate).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '-'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
              <Clock className="h-3 w-3" />
              &Uacute;ltima Sincronizaci&oacute;n
            </p>
            <p className="text-sm">
              {course.lastSyncedAt
                ? new Date(course.lastSyncedAt).toLocaleString('es-ES')
                : 'No sincronizado'}
            </p>
          </div>

          {course.summary && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Descripci&oacute;n</p>
              <p className="text-sm text-gray-600 mt-1">{course.summary}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
