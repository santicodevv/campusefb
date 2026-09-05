import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { coursesApi } from '@/modules/admin/api/courses.api';
import { periodsApi } from '@/modules/admin/api/periods.api';
import { usersApi } from '@/modules/admin/api/users.api';
import type { CreateCourseDto } from '@/shared/types';

export interface UseCreateCourseProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function useCreateCourse({ isOpen, onClose, onSuccess }: UseCreateCourseProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCourseDto>({
    fullname: '',
    shortname: '',
    categoryid: 0,
    idnumber: '',
    summary: '',
    visible: true,
    startdate: '',
    enddate: '',
    periodId: undefined,
  });
  const [enableEndDate, setEnableEndDate] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
    queryKey: ['moodle-categories'],
    queryFn: () => coursesApi.getCategories(),
    enabled: isOpen,
  });

  // Fetch active periods
  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ['active-periods'],
    queryFn: () => periodsApi.getAll(),
    enabled: isOpen,
  });

  // Fetch teachers
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: () => usersApi.getTeachers(),
    enabled: isOpen,
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
      const course = await coursesApi.createCourse(courseData);

      // If a period is selected, add the course to that period's available courses
      if (periodId && course.moodleId) {
        await periodsApi.addAvailableCourses(periodId, {
          courses: [{
            courseMoodleId: course.moodleId,
            courseName: course.fullname,
            courseShortname: course.shortname,
            categoryMoodleId: course.categoryId,
          }],
        });
      }

      // If teachers are selected, assign them to the course
      if (teacherIds && teacherIds.length > 0 && course.moodleId) {
        await coursesApi.assignTeachers(course.moodleId, teacherIds, course.fullname);
      }

      return course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['period-available-courses'] });
      onSuccess?.();
      handleClose();
    },
    onError: (err: unknown) => {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Error al crear el curso');
    },
  });

  const handleClose = () => {
    setFormData({
      fullname: '',
      shortname: '',
      categoryid: 0,
      idnumber: '',
      summary: '',
      visible: true,
      startdate: '',
      enddate: '',
      periodId: undefined,
    });
    setEnableEndDate(false);
    setSelectedTeacherIds([]);
    setError(null);
    onClose();
  };

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
      setError('Debes seleccionar una categoria');
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
      teacherIds: selectedTeacherIds.length > 0 ? selectedTeacherIds : undefined,
    };

    createCourseMutation.mutate(dataToSubmit);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Set default start date to today when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen && !formData.startdate) {
      const today = new Date();
      today.setHours(8, 0, 0, 0);
      setFormData((prev) => ({
        ...prev,
        startdate: today.toISOString().slice(0, 16),
      }));
    }
  }

  return {
    error,
    formData,
    setFormData,
    enableEndDate,
    setEnableEndDate,
    selectedTeacherIds,
    setSelectedTeacherIds,
    categories,
    categoriesLoading,
    periods,
    periodsLoading,
    teachers,
    teachersLoading,
    syncCategoriesMutation,
    createCourseMutation,
    handleClose,
    handleSubmit,
    handleInputChange,
  };
}
