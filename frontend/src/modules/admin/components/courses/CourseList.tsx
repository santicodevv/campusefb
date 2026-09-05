
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Eye, EyeOff, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, Badge, Spinner, Button } from '@/shared/components/ui';
import type { Course, CoursesResponse } from '@/modules/admin/types/course.types';
import type React from 'react';

interface CourseListProps {
  data: CoursesResponse | null | undefined;
  isLoading: boolean;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  selectedCourse: Course | null;
  setSelectedCourse: (course: Course) => void;
  toggleVisibilityMutation: { mutate: (id: number) => void; isPending: boolean };
}

export function CourseList({
  data, isLoading, page, setPage, limit, selectedCourse, setSelectedCourse, toggleVisibilityMutation
}: CourseListProps) {
  const navigate = useNavigate();
  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="lg:col-span-2">
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : data?.courses && data.courses.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupo</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estudiantes</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.courses.map((course: Course) => (
                      <tr
                        key={course.id}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedCourse?.id === course.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedCourse(course)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${course.visible ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <BookOpen className={`h-4 w-4 ${course.visible ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{course.subjectName || course.fullname}</p>
                              <p className="text-xs text-gray-500">ID Moodle: {course.moodleId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-gray-600">{course.shortname}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{course.studentCount ?? '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={course.visible ? 'success' : 'secondary'}>
                            {course.visible ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                toggleVisibilityMutation.mutate(course.id);
                              }}
                              disabled={toggleVisibilityMutation.isPending}
                              title={course.visible ? 'Deshabilitar' : 'Habilitar'}
                              className={course.visible ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}
                            >
                              {course.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                navigate(`/admin/courses/${course.id}`);
                              }}
                              title="Ver detalle completo"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-600">
                  Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, data.total)} de {data.total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <BookOpen className="h-12 w-12 mb-4 text-gray-300" />
              <p>No hay cursos sincronizados</p>
              <p className="text-sm">Ejecuta una sincronización desde Moodle</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
