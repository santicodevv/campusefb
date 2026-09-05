
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Trash2 } from 'lucide-react';
import { Card, CardContent, Button } from '@/shared/components/ui';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Course } from '@/modules/admin/types/course.types';
import { useCourseDetails } from '../../hooks/useCourseDetails';
import { projectionApi } from '../../api/projection.api';
import { EditableField } from './EditableField';
import { CourseStats } from './CourseStats';
import { CourseEmptyState } from './CourseEmptyState';
import { InfoField } from './InfoField';

interface CourseDetailsProps {
  selectedCourse: Course | null;
  updateSubjectNameMutation: UseMutationResult<unknown, unknown, { id: number; subjectName: string }>;
  updateCodeMutation: UseMutationResult<unknown, unknown, { id: number; code: string }>;
  deleteMutation: UseMutationResult<unknown, unknown, number>;
}

export function CourseDetails({
  selectedCourse,
  updateSubjectNameMutation,
  updateCodeMutation,
  deleteMutation
}: CourseDetailsProps) {
  const navigate = useNavigate();
  const {
    editingSubjectName,
    subjectNameValue,
    setSubjectNameValue,
    handleEditSubjectName,
    handleSaveSubjectName,
    handleCancelSubjectName,
    editingCode,
    codeValue,
    setCodeValue,
    handleEditCode,
    handleSaveCode,
    handleCancelCode,
    handleDelete
  } = useCourseDetails({
    selectedCourse,
    updateSubjectNameMutation,
    updateCodeMutation,
    deleteMutation
  });

  const course = selectedCourse;

  const { data: coursePrograms = [] } = useQuery({
    queryKey: ['course-programs', course?.moodleId],
    queryFn: () => projectionApi.getProgramsByCourse(course!.moodleId),
    enabled: !!course,
  });

  return (
    <div className="lg:col-span-1">
      <Card>
        <CardContent className="p-6">
          {course ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Curso</h3>
              <div className="space-y-4">
                <InfoField label="Nombre" value={course.fullname} />

                <EditableField
                  label="Asignatura"
                  value={course.subjectName}
                  placeholder="Nombre de asignatura"
                  isEditing={editingSubjectName}
                  editValue={subjectNameValue}
                  onEditValueChange={setSubjectNameValue}
                  onStartEdit={handleEditSubjectName}
                  onSave={handleSaveSubjectName}
                  onCancel={handleCancelSubjectName}
                />

                <EditableField
                  label="Código"
                  value={course.code}
                  placeholder="Código del curso"
                  isEditing={editingCode}
                  editValue={codeValue}
                  onEditValueChange={setCodeValue}
                  onStartEdit={handleEditCode}
                  onSave={handleSaveCode}
                  onCancel={handleCancelCode}
                  valueClassName="font-mono text-sm"
                />

                <InfoField label="Grupo" value={course.shortname} valueClassName="font-mono" />

                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="ID Moodle" value={course.moodleId} valueClassName="" />
                  <InfoField label="Categoría" value={course.categoryId} valueClassName="" />
                </div>

                <InfoField
                  label="Programa"
                  value={
                    coursePrograms.length > 0 ? (
                      <span className="inline-flex flex-wrap gap-1.5">
                        {coursePrograms.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full"
                          >
                            {p.code} - {p.name}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-gray-400">Sin asignar</span>
                    )
                  }
                  valueClassName="text-sm"
                />

                <div className="grid grid-cols-2 gap-4">
                  <InfoField 
                    label="Fecha Inicio" 
                    value={course.startdate ? new Date(course.startdate).toLocaleDateString() : '-'} 
                    valueClassName="text-sm" 
                  />
                  <InfoField 
                    label="Fecha Fin" 
                    value={course.enddate ? new Date(course.enddate).toLocaleDateString() : '-'} 
                    valueClassName="text-sm" 
                  />
                </div>

                <CourseStats 
                  studentCount={course.studentCount} 
                  teacherCount={course.teacherCount} 
                />

                <InfoField 
                  label="Última Sincronización" 
                  value={course.lastSyncedAt ? new Date(course.lastSyncedAt).toLocaleString() : 'No sincronizado'} 
                  valueClassName="text-sm" 
                />

                <div className="flex gap-2 mt-4">
                  <Button className="flex-1" onClick={() => navigate(`/admin/courses/${course.id}`)}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Ver Detalle
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <CourseEmptyState />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
