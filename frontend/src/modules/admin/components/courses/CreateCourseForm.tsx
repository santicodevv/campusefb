import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '@/modules/admin/api/courses.api';
import { periodsApi } from '@/modules/admin/api/periods.api';
import { usersApi } from '@/modules/admin/api/users.api';
import { projectionApi } from '@/modules/admin/api/projection.api';
import {
  Button,
  Input,
  Select,
  Label,
  Alert,
  Spinner,
} from '@/shared/components/ui';
import {
  BookOpen,
  RefreshCw,
  Calendar,
  Eye,
  EyeOff,
  GraduationCap,
  UserCheck,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type {
  CreateCourseDto,
  MoodleCategory,
  AcademicPeriod,
  CourseWithStats,
} from '@/shared/types';

interface CreateCourseFormProps {
  onSuccess?: (course: CourseWithStats) => void;
  onCancel?: () => void;
  defaultCategoryId?: number;
  projectionProgramId?: number;
  subprogramMoodleId?: number;
  submitLabel?: string;
}

export function CreateCourseForm({
  onSuccess,
  onCancel,
  defaultCategoryId,
  projectionProgramId,
  subprogramMoodleId,
  submitLabel = 'Crear Curso',
}: CreateCourseFormProps) {
  const isProjectionMode = projectionProgramId != null && subprogramMoodleId != null;
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const getDefaultStartDate = () => {
    const today = new Date();
    today.setHours(8, 0, 0, 0);
    return today.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState<CreateCourseDto>({
    fullname: '',
    shortname: '',
    categoryid: defaultCategoryId ?? 0,
    idnumber: '',
    summary: '',
    visible: true,
    startdate: getDefaultStartDate(),
    enddate: '',
    periodId: undefined,
  });
  const [enableEndDate, setEnableEndDate] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);

  // Fetch categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['moodle-categories'],
    queryFn: () => coursesApi.getCategories(),
  });

  const { data: materias = [], isLoading: materiasLoading } = useQuery({
    queryKey: ['subprogram-materias', subprogramMoodleId],
    queryFn: () => projectionApi.getMateriasBySubprogram(subprogramMoodleId!),
    enabled: isProjectionMode,
  });

  // Fetch active periods
  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ['active-periods'],
    queryFn: () => periodsApi.getAll(),
  });

  // Fetch teachers
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: () => usersApi.getTeachers(),
  });

  // Sync categories mutation
  const syncCategoriesMutation = useMutation({
    mutationFn: () => coursesApi.syncCategories(),
    onSuccess: (result) => {
      refetchCategories();
      if (result.programsCreated > 0) {
        toast.success(
          `Categorías sincronizadas (${result.synced}). Programas creados: ${result.programsCreated}. Puedes editarlos en Proyección Académica.`,
        );
      } else {
        toast.success(
          `Categorías sincronizadas (${result.synced}). No se crearon programas nuevos.`,
        );
      }
    },
    onError: () => toast.error('Error al sincronizar categorías'),
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (data: CreateCourseDto & { teacherIds?: number[] }) => {
      const { periodId, teacherIds, ...courseData } = data;
      const course = isProjectionMode
        ? (await projectionApi.createProgramCourse(projectionProgramId!, {
            fullname: courseData.fullname,
            shortname: courseData.shortname,
            level: 1,
            subjectName: courseData.subjectName,
            code: courseData.code,
            idnumber: courseData.idnumber,
            summary: courseData.summary,
            visible: courseData.visible,
            startdate: courseData.startdate,
            enddate: courseData.enddate,
            materiaMoodleId: Number(courseData.categoryid),
          })).course
        : await coursesApi.createCourse(courseData);

      if (!isProjectionMode && periodId && course.moodleId) {
        await periodsApi.addAvailableCourses(periodId, {
          courses: [
            {
              courseMoodleId: course.moodleId,
              courseName: course.fullname,
              courseShortname: course.shortname,
              categoryMoodleId: course.categoryId,
            },
          ],
        });
      }

      if (!isProjectionMode && teacherIds && teacherIds.length > 0 && course.moodleId) {
        await coursesApi.assignTeachers(
          course.moodleId,
          teacherIds,
          course.fullname,
        );
      }

      return course;
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['period-available-courses'] });
      toast.success('Curso creado exitosamente');
      onSuccess?.({ ...course, studentCount: 0, teacherCount: 0 });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Error al crear el curso');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullname.trim()) {
      setError('El nombre completo del curso es requerido');
      return;
    }
    if (!formData.shortname.trim()) {
      setError('El nombre corto del curso es requerido');
      return;
    }
    if (!formData.categoryid) {
      setError(isProjectionMode ? 'Debes seleccionar una materia' : 'Debes seleccionar una categoría');
      return;
    }
    if (!formData.startdate) {
      setError('La fecha de inicio es requerida');
      return;
    }

    const dataToSubmit = {
      ...formData,
      categoryid: Number(formData.categoryid),
      enddate: enableEndDate ? formData.enddate : undefined,
      teacherIds:
        selectedTeacherIds.length > 0 ? selectedTeacherIds : undefined,
    };

    createCourseMutation.mutate(dataToSubmit);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre completo */}
        <div>
          <Label htmlFor="fullname">
            Nombre completo del curso <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullname"
            name="fullname"
            value={formData.fullname}
            onChange={handleInputChange}
            placeholder="Ej: Matematicas I - 2024"
            required
          />
        </div>

        {/* Nombre Asignatura */}
        <div>
          <Label htmlFor="subjectName">
            Nombre de Asignatura (opcional)
          </Label>
          <Input
            id="subjectName"
            name="subjectName"
            value={formData.subjectName || ''}
            onChange={handleInputChange}
            placeholder="Ej: Matemáticas I"
          />
          <p className="text-xs text-gray-500 mt-1">
            Nombre corto que se mostrará en calificaciones
          </p>
        </div>

        {/* Código (manual) */}
        <div>
          <Label htmlFor="code">
            Código (opcional)
          </Label>
          <Input
            id="code"
            name="code"
            value={formData.code || ''}
            onChange={handleInputChange}
            placeholder="Ej: TEO101"
          />
          <p className="text-xs text-gray-500 mt-1">
            Código que se mostrará en el record de notas
          </p>
        </div>

        {/* Grupo (shortname) */}
        <div>
          <Label htmlFor="shortname">
            Grupo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="shortname"
            name="shortname"
            value={formData.shortname}
            onChange={handleInputChange}
            placeholder="Ej: MAT101-2024"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Identificador del grupo (viene del sync de Moodle)
          </p>
        </div>

        {/* Categoria o materia */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="categoryid">
              {isProjectionMode ? 'Materia' : 'Categoría de cursos'} <span className="text-red-500">*</span>
            </Label>
            {!isProjectionMode && <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => syncCategoriesMutation.mutate()}
              disabled={syncCategoriesMutation.isPending}
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${syncCategoriesMutation.isPending ? 'animate-spin' : ''}`}
              />
              Sincronizar
            </Button>}
          </div>
          {isProjectionMode ? (materiasLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Spinner className="h-4 w-4" />
              <span className="text-sm text-gray-500">Cargando materias...</span>
            </div>
          ) : (
            <Select
              id="categoryid"
              name="categoryid"
              value={formData.categoryid}
              onChange={handleInputChange}
              placeholder="Selecciona una materia"
            >
              <option value="">Selecciona una materia</option>
                  {materias.map((materia) => (
                <option key={materia.moodleId} value={materia.moodleId}>
                  {materia.name}
                </option>
              ))}
            </Select>
          )) : categoriesLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Spinner className="h-4 w-4" />
              <span className="text-sm text-gray-500">
                Cargando categorías...
              </span>
            </div>
          ) : categories && categories.length > 0 ? (
            <Select
              id="categoryid"
              name="categoryid"
              value={formData.categoryid}
              onChange={handleInputChange}
              placeholder="Selecciona una categoría"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat: MoodleCategory) => (
                <option key={cat.moodleId} value={cat.moodleId}>
                  {cat.name}{' '}
                  {cat.coursecount > 0 && `(${cat.coursecount} cursos)`}
                </option>
              ))}
            </Select>
          ) : (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              No hay categorías disponibles. Haz click en "Sincronizar"
              para obtener las categorías de Moodle.
            </div>
          )}
        </div>

        {/* Periodo académico */}
        <div>
          <Label htmlFor="periodId">
            <GraduationCap className="h-4 w-4 inline mr-1" />
            Período académico (opcional)
          </Label>
          {periodsLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Spinner className="h-4 w-4" />
              <span className="text-sm text-gray-500">
                Cargando períodos...
              </span>
            </div>
          ) : periods && periods.length > 0 ? (
            <Select
              id="periodId"
              name="periodId"
              value={formData.periodId || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  periodId: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
            >
              <option value="">Sin asignar a período</option>
              {periods
                .filter((p: AcademicPeriod) => p.status !== 'closed')
                .map((period: AcademicPeriod) => (
                  <option key={period.id} value={period.id}>
                    {period.name} (
                    {period.status === 'open' ? 'Activo' : 'Planificado'})
                  </option>
                ))}
            </Select>
          ) : (
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
              No hay períodos disponibles.
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            El curso estará disponible para reinscripción en este período
          </p>
        </div>

        {/* Profesores - full width */}
        <div className="md:col-span-2">
          <Label>
            <UserCheck className="h-4 w-4 inline mr-1" />
            Profesores (opcional)
          </Label>
          {teachersLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Spinner className="h-4 w-4" />
              <span className="text-sm text-gray-500">
                Cargando profesores...
              </span>
            </div>
          ) : teachers && teachers.length > 0 ? (
            <div className="space-y-2">
              <Select
                onChange={(e) => {
                  const teacherId = Number(e.target.value);
                  if (
                    teacherId &&
                    !selectedTeacherIds.includes(teacherId)
                  ) {
                    setSelectedTeacherIds((prev) => [...prev, teacherId]);
                  }
                  e.target.value = '';
                }}
              >
                <option value="">Seleccionar profesor...</option>
                {teachers
                  .filter((t) => !selectedTeacherIds.includes(t.id))
                  .map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.displayName || teacher.email}
                    </option>
                  ))}
              </Select>
              {selectedTeacherIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTeacherIds.map((teacherId) => {
                    const teacher = teachers.find(
                      (t) => t.id === teacherId,
                    );
                    return (
                      <span
                        key={teacherId}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {teacher?.displayName || teacher?.email}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedTeacherIds((prev) =>
                              prev.filter((id) => id !== teacherId),
                            )
                          }
                          className="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
              No hay profesores disponibles.
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Asigna profesores al curso (puedes agregar más después)
          </p>
        </div>

        {/* Visibilidad */}
        <div>
          <Label>Visibilidad del curso</Label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visible"
                checked={formData.visible === true}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, visible: true }))
                }
                className="h-4 w-4 text-blue-600"
              />
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-sm">Mostrar</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visible"
                checked={formData.visible === false}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, visible: false }))
                }
                className="h-4 w-4 text-blue-600"
              />
              <EyeOff className="h-4 w-4 text-gray-400" />
              <span className="text-sm">Ocultar</span>
            </label>
          </div>
        </div>

        {/* Numero ID */}
        <div>
          <Label htmlFor="idnumber">Número ID del curso (opcional)</Label>
          <Input
            id="idnumber"
            name="idnumber"
            value={formData.idnumber}
            onChange={handleInputChange}
            placeholder="Ej: 2024-MAT-001"
          />
          <p className="text-xs text-gray-500 mt-1">
            Identificador externo para integraciones
          </p>
        </div>

        {/* Fecha de inicio */}
        <div>
          <Label htmlFor="startdate">
            <Calendar className="h-4 w-4 inline mr-1" />
            Fecha de inicio <span className="text-red-500">*</span>
          </Label>
          <Input
            id="startdate"
            name="startdate"
            type="datetime-local"
            value={formData.startdate}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Fecha de fin */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="enableEndDate"
              checked={enableEndDate}
              onChange={(e) => setEnableEndDate(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <Label htmlFor="enableEndDate" className="mb-0">
              <Calendar className="h-4 w-4 inline mr-1" />
              Habilitar fecha de finalización
            </Label>
          </div>
          {enableEndDate && (
            <Input
              id="enddate"
              name="enddate"
              type="datetime-local"
              value={formData.enddate}
              onChange={handleInputChange}
            />
          )}
        </div>

        {/* Descripcion - full width */}
        <div className="md:col-span-2">
          <Label htmlFor="summary">
            Descripción del curso (opcional)
          </Label>
          <textarea
            id="summary"
            name="summary"
            value={formData.summary}
            onChange={handleInputChange}
            rows={3}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Descripción breve del curso..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={createCourseMutation.isPending}>
          {createCourseMutation.isPending ? (
            <>
              <Spinner className="h-4 w-4 mr-2" />
              Creando...
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4 mr-2" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default CreateCourseForm;
